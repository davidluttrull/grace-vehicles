/**
 * Grace Baptist Church - Vehicle Sign-Out
 *
 * Back end for the vehicle sign-out page (index.html, hosted on GitHub
 * Pages). The page loads the vehicle, issue and driver lists from doPost and
 * sends each sign-out back to it. Each sign-out becomes one row on the
 * Sign-Outs tab and is emailed to everyone on the Notify Emails tab.
 * See SETUP.md for how to deploy it.
 *
 * The vehicles are listed on the Vehicles tab: add or delete a row there and
 * the page shows the change the next time it opens. Drivers are kept on the
 * Drivers tab: new names are added there the first time someone signs out.
 * To change the list of common issues, edit ISSUES below and deploy a new
 * version.
 */

const SIGNOUTS_NAME = 'Sign-Outs';
const DRIVERS_NAME = 'Drivers';
const VEHICLES_NAME = 'Vehicles';
const EMAILS_NAME = 'Notify Emails';

// The Vehicles tab starts with these. After that, the tab is the list.
const STARTING_VEHICLES = ['Van 1', 'Van 2', 'Bus 3', 'Bus 25'];

// Common problems drivers can tick. "Other" asks them to describe it.
const ISSUES = [
  'Warning or check engine light',
  'Tire low, worn or damaged',
  'Brakes (noise, soft pedal)',
  'Headlight, brake light or signal out',
  'Wipers or washer fluid',
  'Heat or A/C not working',
  'Fluid leak',
  'Windshield or mirror damage',
  'Body damage (dent, scratch)',
  'Seat or seat belt problem',
  'Door or wheelchair lift',
  'Needs fuel',
  'Needs cleaning inside',
  'Other',
];

// People emailed about every sign-out, put on the Notify Emails tab by setup.
// Their addresses go in column A beside their names.
const NOTIFY_NAMES = ['Robert Tucker', 'Shawn Criswell'];

const HEADERS = ['Date', 'Driver', 'Vehicle', 'Pre-Trip Inspection', 'Post-Trip Inspection',
  'Issues', 'Issue Details', 'Submitted At', 'Emailed'];

// How the Date and Submitted At columns show in the sheet.
const DATE_FORMAT = 'ddd m/d/yyyy';
const SUBMITTED_FORMAT = 'm/d/yyyy h:mm am/pm';

const BRAND_DEEP = '#233617';
const BRAND_MID = '#4E7A35';
const ISSUE_RED = '#B3261E';
const LOGO_URL = 'https://davidluttrull.github.io/grace-attendance/logo.png';

const MAX_BAD_CODES = 20; // wrong driver codes allowed per 10 minutes, across all phones

/** GET: just says the script is running, to check a deployment in a browser. */
function doGet() {
  return json_({ app: 'Vehicle Sign-Out', status: 'ok' });
}

/**
 * POST from the page, body {action, code, form}. The page sends it as plain
 * text with no Google login attached, so it works whatever account a phone
 * uses. Every action needs the driver code, so a stranger who finds the page
 * can't read the driver list or send emails.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (!codeIsRight_(body.code)) return json_({ status: 'badcode' });
    if (body.action === 'load') return json_(pageConfig_());
    if (body.action === 'submit') return json_(submitSignOut(body.form));
    throw new Error('Unknown request. Reload the page and try again.');
  } catch (err) {
    return json_({ status: 'error', message: err.message });
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this once from the editor to create the tabs and grant permissions. It
 * also creates the driver code (the first time) and shows it in the Execution
 * log. To change the code, edit DRIVER_CODE under Project Settings > Script
 * Properties.
 */
function setup() {
  const sheet = signOutsTab_();
  vehiclesTab_();
  driversTab_();
  emailsTab_();
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);

  const props = PropertiesService.getScriptProperties();
  let code = props.getProperty('DRIVER_CODE');
  if (!code) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    props.setProperty('DRIVER_CODE', code);
  }
  Logger.log('Driver code: ' + code);
}

/**
 * Checks a code against the DRIVER_CODE Script Property, refusing everything
 * for 10 minutes after too many wrong ones. The code isn't in this file, so
 * the public copy on GitHub doesn't give it away.
 */
function codeIsRight_(code) {
  const expected = PropertiesService.getScriptProperties().getProperty('DRIVER_CODE');
  if (!expected) throw new Error('The code hasn\'t been set up yet. Run setup in Apps Script.');
  const cache = CacheService.getScriptCache();
  const misses = Number(cache.get('badDRIVER_CODE') || 0);
  if (misses >= MAX_BAD_CODES) throw new Error('Too many wrong codes. Wait 10 minutes and try again.');
  if (String(code || '').trim() === expected.trim()) return true;
  cache.put('badDRIVER_CODE', String(misses + 1), 600);
  return false;
}

function pageConfig_() {
  return { status: 'ok', vehicles: vehicleNames_(), issues: ISSUES, drivers: driverNames_(driversTab_()) };
}

/** Saves one sign-out as a row, adds a new driver to the list, and emails it. */
function submitSignOut(form) {
  form = form || {};
  const date = parseDate_(form.date);
  const driver = driverName_(form.driver);
  if (!driver) throw new Error('Please enter the driver\'s name.');
  const vehicle = String(form.vehicle || '');
  if (!vehicle) throw new Error('Please pick a vehicle.');
  // A page opened before a vehicle was removed from the tab may still show it.
  if (vehicleNames_().indexOf(vehicle) === -1) {
    throw new Error(vehicle + ' is no longer on the vehicle list. Close the page, open it again, and pick a vehicle.');
  }

  // A page with an older issue list may send one that's no longer in ISSUES.
  // Keep it rather than lose a reported problem.
  const issues = (Array.isArray(form.issues) ? form.issues : []).slice(0, 30)
    .map(function (s) { return clean_(s, 80); })
    .filter(function (s, i, all) { return s && all.indexOf(s) === i; });
  const details = clean_(form.details, 1000);
  if (issues.indexOf('Other') !== -1 && !details) throw new Error('Please describe the other issue.');

  const record = {
    'Date': date,
    'Driver': driver,
    'Vehicle': vehicle,
    'Pre-Trip Inspection': form.preTrip ? 'Yes' : 'No',
    'Post-Trip Inspection': form.postTrip ? 'Yes' : 'No',
    'Issues': issues.join(', '),
    'Issue Details': details,
    'Submitted At': new Date(),
    'Emailed': 'Sending',
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let sheet, cols, row;
  try {
    record['Driver'] = addDriver_(driver);
    sheet = signOutsTab_();
    cols = headerIndex_(sheet);
    const values = new Array(sheet.getLastColumn()).fill('');
    HEADERS.forEach(function (h) { values[cols[h] - 1] = record[h]; });
    sheet.appendRow(values);
    row = sheet.getLastRow();
    sheet.getRange(row, cols['Date']).setNumberFormat(DATE_FORMAT);
    sheet.getRange(row, cols['Submitted At']).setNumberFormat(SUBMITTED_FORMAT);
  } finally {
    lock.releaseLock();
  }

  const sent = sendNotice_(record, issues);
  sheet.getRange(row, cols['Emailed']).setValue(sent.status);
  return { status: 'saved', driver: record['Driver'], notified: sent.names };
}

// ---- Email ------------------------------------------------------------------

/**
 * Emails one sign-out to everyone on the Notify Emails tab. Returns the text
 * for the Emailed column and the names of the people it went to.
 */
function sendNotice_(record, issues) {
  const people = recipients_();
  if (!people.length) return { status: 'Not sent: no addresses on ' + EMAILS_NAME, names: [] };

  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const day = Utilities.formatDate(record['Date'], tz, 'EEE, MMM d');
  const subject = 'Vehicle Sign-Out Log: ' + (issues.length ? 'Repairs needed - ' : '') +
    record['Vehicle'] + ', ' + record['Driver'] + ' (' + day + ')';
  try {
    MailApp.sendEmail({
      to: people.map(function (p) { return p.email; }).join(','),
      subject: subject,
      body: noticeText_(record, issues, day),
      htmlBody: noticeHtml_(record, issues, day),
      name: 'Grace Vehicle Sign-Out',
    });
  } catch (err) {
    console.error('Could not send the email: ' + err.message);
    return { status: 'Failed: ' + err.message, names: [] };
  }
  const at = Utilities.formatDate(new Date(), tz, 'M/d h:mm a');
  return {
    status: 'Sent ' + at + ' to ' + people.length,
    names: people.map(function (p) { return p.name || p.email; }),
  };
}

/** [{email, name}] from the Notify Emails tab: addresses in A, names in B. */
function recipients_() {
  const tab = emailsTab_();
  const last = tab.getLastRow();
  if (last < 2) return [];
  return tab.getRange(2, 1, last - 1, 2).getValues()
    .map(function (r) { return { email: String(r[0]).trim(), name: String(r[1]).trim() }; })
    .filter(function (p) { return p.email.indexOf('@') > 0; });
}

function noticeText_(record, issues, day) {
  const lines = [
    record['Vehicle'] + ' signed out by ' + record['Driver'] + ' on ' + day,
    '',
    'Pre-trip inspection: ' + record['Pre-Trip Inspection'],
    'Post-trip inspection: ' + record['Post-Trip Inspection'],
    '',
    issues.length ? 'Issues reported:' : 'No issues reported.',
  ];
  issues.forEach(function (s) { lines.push('  - ' + s); });
  if (record['Issue Details']) lines.push('', 'Details: ' + record['Issue Details']);
  return lines.join('\n');
}

function noticeHtml_(record, issues, day) {
  const row = function (label, value, color) {
    return '<tr><td style="padding:8px 0;color:#5B6A50;width:150px;vertical-align:top;">' + label + '</td>' +
      '<td style="padding:8px 0;font-weight:600;color:' + (color || '#1E2A16') + ';">' + value + '</td></tr>';
  };
  const check = function (h) {
    return record[h] === 'Yes' ? row(h, 'Done') : row(h, 'Not checked', ISSUE_RED);
  };
  let issueBlock;
  if (issues.length) {
    issueBlock = '<div style="margin-top:16px;padding:14px 16px;border-radius:10px;background:#FCE8E6;' +
      'border:1px solid #F4C7C3;"><div style="font-weight:700;color:' + ISSUE_RED + ';margin-bottom:6px;">' +
      'Issues or repairs needed</div><ul style="margin:0;padding-left:20px;">' +
      issues.map(function (s) { return '<li style="margin:2px 0;">' + esc_(s) + '</li>'; }).join('') + '</ul>' +
      (record['Issue Details'] ? '<p style="margin:10px 0 0;white-space:pre-wrap;">' +
        esc_(record['Issue Details']) + '</p>' : '') + '</div>';
  } else {
    issueBlock = '<div style="margin-top:16px;padding:12px 16px;border-radius:10px;background:#EFF6EA;' +
      'border:1px solid #C6DBB6;color:' + BRAND_DEEP + ';font-weight:600;">No issues reported</div>' +
      (record['Issue Details'] ? '<p style="margin:10px 0 0;white-space:pre-wrap;">' +
        esc_(record['Issue Details']) + '</p>' : '');
  }
  return '<div style="background:#F3F8EF;padding:20px 12px;font-family:Arial,Helvetica,sans-serif;' +
    'font-size:15px;line-height:1.4;color:#1E2A16;">' +
    '<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #DCE7D3;border-radius:14px;' +
    'overflow:hidden;">' +
    '<div style="background:' + BRAND_DEEP + ';padding:16px;text-align:center;">' +
    '<img src="' + LOGO_URL + '" alt="Grace Baptist Church" width="150" style="display:block;margin:0 auto;">' +
    '<div style="color:#CFE3C0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin-top:6px;">' +
    'Vehicle Sign-Out</div></div>' +
    '<div style="padding:18px 20px 20px;">' +
    '<div style="font-size:24px;font-weight:700;color:' + BRAND_DEEP + ';">' + esc_(record['Vehicle']) + '</div>' +
    '<div style="color:#5B6A50;margin-bottom:10px;">' + esc_(day) + '</div>' +
    '<table style="width:100%;border-collapse:collapse;border-top:1px solid #DCE7D3;">' +
    row('Driver', esc_(record['Driver'])) +
    check('Pre-Trip Inspection') +
    check('Post-Trip Inspection') +
    '</table>' + issueBlock +
    '</div></div>' +
    '<p style="text-align:center;color:#5B6A50;font-size:12px;margin:12px 0 0;">' +
    'Sent by the vehicle sign-out page.</p></div>';
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ---- Drivers ----------------------------------------------------------------

function driverNames_(tab) {
  const last = tab.getLastRow();
  if (last < 2) return [];
  return tab.getRange(2, 1, last - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(String);
}

/**
 * Returns the name as the Drivers tab spells it, adding it (and re-sorting
 * the list) if it's new. "john smith" matches "John Smith".
 */
function addDriver_(name) {
  const tab = driversTab_();
  const names = driverNames_(tab);
  const lower = name.toLowerCase();
  for (let i = 0; i < names.length; i++) {
    if (names[i].toLowerCase() === lower) return names[i];
  }
  tab.appendRow([name]);
  tab.getRange(2, 1, tab.getLastRow() - 1, 1).sort(1);
  return name;
}

/** Tidies a typed name: trims, single spaces, and capitals if typed all lowercase. */
function driverName_(value) {
  let s = clean_(value, 60).replace(/\s+/g, ' ');
  if (s && s === s.toLowerCase()) {
    s = s.replace(/(^|[\s'-])([a-z])/g, function (m, before, letter) { return before + letter.toUpperCase(); });
  }
  return s;
}

// ---- Tabs -------------------------------------------------------------------

/** Returns the Sign-Outs tab, creating it if needed. */
function signOutsTab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SIGNOUTS_NAME);
  if (!sheet) {
    const sheets = ss.getSheets();
    // A brand-new spreadsheet has one empty "Sheet1": reuse it.
    if (sheets.length === 1 && sheets[0].getLastRow() === 0) {
      sheet = sheets[0].setName(SIGNOUTS_NAME);
    } else {
      sheet = ss.insertSheet(SIGNOUTS_NAME, 0);
    }
  }
  headerIndex_(sheet);
  return sheet;
}

/** Makes sure every header exists (adding missing ones on the right) and maps name -> column. */
function headerIndex_(sheet) {
  const lastCol = sheet.getLastColumn();
  const current = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
  const missing = HEADERS.filter(function (h) { return current.indexOf(h) === -1; });

  if (missing.length) {
    if (sheet.getMaxColumns() < current.length + missing.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), current.length + missing.length - sheet.getMaxColumns());
    }
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
    current.push.apply(current, missing);
    formatSignOuts_(sheet, current);
  }

  const index = {};
  current.forEach(function (h, i) { if (h) index[h] = i + 1; });
  return index;
}

/** Header colours, column formats, and a pink row for any sign-out that reported an issue. */
function formatSignOuts_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setFontColor('#ffffff')
    .setBackground(BRAND_DEEP).setWrap(true).setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
  const rows = sheet.getMaxRows() - 1;
  const col = function (h) { return sheet.getRange(2, headers.indexOf(h) + 1, rows, 1); };
  col('Date').setNumberFormat(DATE_FORMAT);
  col('Submitted At').setNumberFormat(SUBMITTED_FORMAT);
  col('Issue Details').setWrap(true);
  sheet.setColumnWidth(headers.indexOf('Driver') + 1, 160);
  sheet.setColumnWidth(headers.indexOf('Issues') + 1, 240);
  sheet.setColumnWidth(headers.indexOf('Issue Details') + 1, 280);

  const issues = String.fromCharCode(64 + headers.indexOf('Issues') + 1);
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + issues + '2<>""')
    .setBackground('#FCE8E6')
    .setRanges([sheet.getRange(2, 1, rows, headers.length)])
    .build();
  sheet.setConditionalFormatRules([rule]);
}

/** The Vehicles tab's names, top to bottom, skipping blanks and repeats. */
function vehicleNames_() {
  const tab = vehiclesTab_();
  const last = tab.getLastRow();
  if (last < 2) return [];
  return tab.getRange(2, 1, last - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(function (v, i, all) { return v && all.indexOf(v) === i; });
}

function vehiclesTab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let tab = ss.getSheetByName(VEHICLES_NAME);
  if (!tab) {
    tab = ss.insertSheet(VEHICLES_NAME);
    tab.getRange(1, 1, 1, 2).setValues([['Vehicle', 'The vehicles the page shows, in this order. ' +
      'Add a row for a new vehicle; delete a row to take one off the page. Past sign-outs keep their vehicle.']]);
    tab.getRange(1, 1).setFontWeight('bold').setFontColor('#ffffff').setBackground(BRAND_DEEP);
    tab.getRange(1, 2).setFontColor('#5B6A50').setFontStyle('italic');
    tab.getRange(2, 1, STARTING_VEHICLES.length, 1).setValues(STARTING_VEHICLES.map(function (v) { return [v]; }));
    tab.setColumnWidth(1, 180);
    tab.setFrozenRows(1);
  }
  return tab;
}

function driversTab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let tab = ss.getSheetByName(DRIVERS_NAME);
  if (!tab) {
    tab = ss.insertSheet(DRIVERS_NAME);
    tab.getRange(1, 1, 1, 2).setValues([['Driver', 'The names the page suggests. New drivers are ' +
      'added when they first sign out. Fix a spelling or delete a row to change the list.']]);
    tab.getRange(1, 1).setFontWeight('bold').setFontColor('#ffffff').setBackground(BRAND_DEEP);
    tab.getRange(1, 2).setFontColor('#5B6A50').setFontStyle('italic');
    tab.setColumnWidth(1, 220);
    tab.setFrozenRows(1);
  }
  return tab;
}

function emailsTab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let tab = ss.getSheetByName(EMAILS_NAME);
  if (!tab) {
    tab = ss.insertSheet(EMAILS_NAME);
    tab.getRange(1, 1, 1, 3).setValues([['Email', 'Name', 'Everyone here is emailed about every ' +
      'sign-out. One address per row in column A; the name is optional. Clear the list to stop sending.']]);
    tab.getRange(1, 1, 1, 2).setFontWeight('bold').setFontColor('#ffffff').setBackground(BRAND_DEEP);
    tab.getRange(1, 3).setFontColor('#5B6A50').setFontStyle('italic');
    tab.getRange(2, 2, NOTIFY_NAMES.length, 1).setValues(NOTIFY_NAMES.map(function (n) { return [n]; }));
    tab.setColumnWidth(1, 280);
    tab.setColumnWidth(2, 160);
    tab.setFrozenRows(1);
  }
  return tab;
}

// ---- Values -----------------------------------------------------------------

/** "2026-10-29" -> Date at noon, so a time zone difference can't shift the day. */
function parseDate_(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!m) throw new Error('Please pick a date.');
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
}

/** Trims text and stops it from being read as a spreadsheet formula. */
function clean_(value, max) {
  let s = String(value === null || value === undefined ? '' : value).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
