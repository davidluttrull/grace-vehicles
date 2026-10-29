# Vehicle Sign-Out: Setup

This replaces the paper vehicle sign-out sheet with a web page drivers open on their phones. Each time a driver submits, it adds one row to a Google Sheet and emails Robert Tucker and Shawn Criswell.

It has two parts:

- **The Sheet and its script** (`Code.gs`). The script lives inside the Google Sheet. It saves each sign-out as a row, keeps the list of drivers, and sends the email.
- **The drivers' page** (`index.html`, plus the logo, icons, and `manifest.webmanifest`). It's hosted on GitHub Pages, like the ushers' page, at <https://davidluttrull.github.io/grace-vehicles/>.

The page talks to the script without any Google sign-in, so drivers don't need a Google account. Instead, the page asks for the **driver code** the first time, a 6-digit number the script creates for you. Without it, a stranger who found the page couldn't see the driver list or send emails.

## 1. Create the Sheet

1. Sign in to the Google account that should own the records. The church office account is a better choice than a personal one, because the page keeps working when people leave. The emails come from this account.
2. Create a new blank Google Sheet and name it something like **Vehicle Sign-Out**.

## 2. Add the script

1. In the Sheet, open **Extensions → Apps Script**.
2. Click "Untitled project" at the top and rename it **Vehicle Sign-Out**.
3. You'll see a file called `Code.gs` with a few lines in it. Delete them, then paste in the entire contents of this folder's `Code.gs`.
4. Click the save icon (💾).

## 3. Run setup once

1. In the function dropdown next to **Debug**, pick **setup**, then click **Run**.
2. Google will ask for permission. Click **Review permissions** and choose your account.
3. You'll get a warning that says "Google hasn't verified this app". That's expected for a script you wrote yourself. Click **Advanced → Go to Vehicle Sign-Out (unsafe) → Allow**. The script asks to edit this spreadsheet and to send email as you.
4. Switch back to the Sheet. You should see three tabs:
   - **Sign-Outs**, with a dark green header row
   - **Drivers**, empty for now
   - **Notify Emails**, with Robert Tucker and Shawn Criswell in column B
5. On **Notify Emails**, type each person's email address in column A beside their name. To email someone else too, add their address on a new row. The name in column B is optional; the page uses it to tell the driver who was emailed.
6. Back in Apps Script, click **Execution log** at the top. The last line reads **Driver code: 123456**, with your own number. Give it to the drivers. Running setup again shows the same code.

To fill in the driver list before anyone signs out, type the names on the **Drivers** tab, one per row in column A. You can also leave it empty: each new name is added the first time that person signs out.

## 4. Deploy the script

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** `v1`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**. The page needs this setting to reach the script without a sign-in.
4. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.

To check the deployment, open that URL in a browser. You should see `{"app":"Vehicle Sign-Out","status":"ok"}`.

## 5. Connect the page to the script

Near the bottom of `index.html`, find the line that starts with `const API_URL =`, and put the `/exec` URL from step 4 between the quotes. Then publish the page to GitHub (the `grace-vehicles` repository, with GitHub Pages turned on for the main branch).

This only needs to be done once. Deploying a new version of the script later keeps the same URL.

## 6. Put it on the drivers' phones

Send the drivers the page's address and the driver code. If you'd like a shorter address, have the church site forward something like `gracetoanderson.com/vehicles` there, the way `ushercount` forwards to the ushers' page. Each driver should save the page to their home screen. It shows up as **Vehicles** with the Grace cross icon.

- **iPhone:** open the link in Safari, tap the Share button, then tap **Add to Home Screen**.
- **Android:** open the link in Chrome, tap **⋮**, then tap **Add to Home screen** (or **Install app**).

### A link with the code in it

So drivers don't have to type the code, send them a link with it on the end. Put your driver code after `#code=`:

```
https://davidluttrull.github.io/grace-vehicles/#code=123456
```

Opening the link saves the code on that phone and goes straight to the form. The page then takes the code off the address bar, so the home-screen icon and any screenshot don't show it. The part after `#` stays on the phone and isn't sent to GitHub.

Anyone with this link can submit sign-outs, the same as anyone who knows the code. Send it to drivers by text or email; don't post it publicly. If the link has the wrong code, the page says so and asks for the code instead.

## How it works

- The page asks for the driver code the first time, and the phone remembers it.
- The date fills in as today. Tap it to change it.
- **Driver name** suggests names from the Drivers tab as you type. Typing "smi" finds John Smith. A name that isn't on the list gets the note "New driver: … will be added to the list", and it's added when the form is submitted. A name typed all in lowercase is saved with capitals, and "john smith" matches "John Smith" on the list rather than adding him twice.
- The phone remembers the last driver's name and fills it in next time.
- Pick one vehicle: Van 1, Van 2, Bus 3 or Bus 25.
- Tick **Pre-trip inspection done** and **Post-trip inspection done** as they're finished. Neither is required. If the pre-trip box isn't ticked, the confirmation asks the driver to check before submitting.
- Under **Issues or Repairs Needed**, tick anything that needs attention and add details in the box below. If **Other** is ticked, the details box has to be filled in. Leave everything blank if nothing's wrong.
- Before saving, the page shows the vehicle, driver, date and number of issues and asks the driver to confirm. If saving fails, everything stays on the screen so the driver can try again.
- A wrong driver code is rejected and the page asks for it again. After 20 wrong codes within 10 minutes, from any phones, the script stops accepting sign-outs for 10 minutes, so nobody can guess the code by trying numbers.

## The email

Each sign-out is emailed right away to everyone on the **Notify Emails** tab.

- When no issues are reported, the subject reads **Vehicle Sign-Out Log: Bus 25, John Smith (Thu, Oct 29)**.
- When any issue is ticked, it reads **Vehicle Sign-Out Log: Repairs needed - Bus 25, John Smith (Thu, Oct 29)**, so it stands out in the inbox. The issues are listed in a red box with the driver's details.
- An inspection that wasn't ticked shows **Not checked** in red.
- The **Emailed** column on the Sign-Outs tab shows *Sent* with the time and number of people, *Not sent* if Notify Emails has no addresses, or *Failed* with the reason. A failed email doesn't lose the sign-out; it's still on the sheet.
- To stop the emails, clear the addresses on Notify Emails.

## The Sheet

- **Sign-Outs:** one row per sign-out: date, driver, vehicle, pre-trip and post-trip (Yes or No), the issues ticked, the details, when it was submitted, and whether it was emailed. Rows that reported an issue are shaded pink.
- **Drivers:** the names the page suggests, in alphabetical order. To fix a misspelled name, correct it here; to take someone off the list, delete their row. Phones pick up the change the next time the page opens. Past sign-outs keep the name as it was.
- **Notify Emails:** who gets the email.

You can sort, filter, or add your own columns to the right of Sign-Outs. The script finds its columns by their header names, so leave the tab names and the existing header names unchanged.

## Changing the driver code

Change the code if it gets passed around more than you'd like. In Apps Script, click the gear icon (**Project Settings**) on the left, scroll to **Script Properties**, click **Edit script properties**, change the value of **DRIVER_CODE**, and click **Save script properties**. The new code works right away; you don't need to redeploy. Each phone asks for the new code the next time the page opens. Links with the old code stop working too, so send drivers a new link.

## Changing the vehicles or the issue list

The vehicles are in `VEHICLES` near the top of `Code.gs`, and the common issues are in `ISSUES` just below. Keep the item named **Other** spelled exactly that way, because it's the one that asks for details. Edit the list, then follow "Updating the script" below. The page reads both lists from the script, so it doesn't need to change.

## Updating the script

Whenever `Code.gs` changes:

1. Paste the new version into Apps Script and save.
2. Run **setup** once (step 3 above). If the new version needs a new permission, Google asks for it here.
3. Click **Deploy → Manage deployments**, then click the pencil icon. Under **Version**, choose **New version**, then click **Deploy**.

Don't use **New deployment**, because it creates a new URL and the page would stop reaching the script.
