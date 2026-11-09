# Vehicle Sign-Out: Setup

This replaces the paper vehicle sign-out sheet with a web page drivers open on their phones. A driver checks a vehicle out before a trip (date, name, vehicle) and checks it back in afterward with the post-trip inspection and any issues. Each trip is one row in a Google Sheet, and each check-out and check-in is emailed to Robert Tucker and Shawn Criswell. The pre-trip inspection isn't on the page, because it's done for the drivers.

It has two parts:

- **The Sheet and its script** (`Code.gs`). The script lives inside the Google Sheet. It saves each trip as a row, keeps track of which vehicles are out, keeps the list of drivers, and sends the email.
- **The drivers' page** (`index.html`, plus the logo, icons, and `manifest.webmanifest`). It's hosted on GitHub Pages, like the ushers' page, at <https://davidluttrull.github.io/grace-vehicles/>.

The page talks to the script without any Google sign-in, so drivers don't need a Google account. Instead, the page asks for the **driver code** the first time, a 6-digit number the script creates for you. Without it, a stranger who found the page couldn't see the driver list, check vehicles in or out, or send emails.

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
4. Switch back to the Sheet. You should see four tabs:
   - **Sign-Outs**, with a dark green header row
   - **Vehicles**, listing Van 1, Van 2, Bus 3 and Bus 25
   - **Drivers**, empty for now
   - **Notify Emails**, with Robert Tucker and Shawn Criswell in column B
5. On **Notify Emails**, type each person's email address in column A beside their name. To email someone else too, add their address on a new row. The name in column B is optional; the page uses it to tell the driver who was emailed.
6. Back in Apps Script, click **Execution log** at the top. The last line reads **Driver code: 123456**, with your own number. Give it to the drivers. Running setup again shows the same code.

To fill in the driver list before anyone signs out, type the names on the **Drivers** tab, one per row in column A. You can also leave it empty: each new name is added the first time that person uses the page.

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

Anyone with this link can check vehicles in and out, the same as anyone who knows the code. Send it to drivers by text or email; don't post it publicly. If the link has the wrong code, the page says so and asks for the code instead.

## How it works

The page has two tabs at the top: **Check Out** and **Check In**. The Check In tab shows how many vehicles are out right now.

### Checking out

- The date fills in as today. Tap it to change it.
- **Driver name** suggests names from the Drivers tab as you type. Typing "smi" finds John Smith. A name that isn't on the list gets the note "New driver: ... will be added to the list", and it's added when the form is saved. A name typed all in lowercase is saved with capitals, and "john smith" matches "John Smith" on the list rather than adding him twice.
- The phone remembers the last driver's name and fills it in next time.
- Pick one vehicle. The buttons are the vehicles on the Vehicles tab, in the same order. A vehicle that's already out says who has it, such as **Out: John Smith**.
- Before saving, the page shows the vehicle, driver and date and asks the driver to confirm. After saving, it says who was emailed.
- After check-out, the page switches to Check In with that vehicle picked, ready for when the driver gets back. The next time the page opens on that phone, it opens on Check In too, until the vehicle is checked in.

If a driver checks out a vehicle that's still out (say the last driver forgot to check it in), the page warns them first. If they go ahead, the earlier trip is marked **Not checked in** on the sheet and the new trip starts.

### Checking in

- Pick the vehicle you're bringing back. Only vehicles that are checked out are shown, each with the driver's name and the day it went out. If nothing is out, the page says so.
- The driver name is whoever is checking it in. It doesn't have to be the person who checked it out.
- **Post-Trip Inspection:** the driver ticks each item: walked around the vehicle and looked for damage, checked for items left behind, took out the trash. All of them are required.
- **Issues or Repairs Needed:** tick anything that needs attention and add details in the box below. If **Other** is ticked, the details box has to be filled in. Leave everything blank if nothing's wrong.
- Before saving, the page shows the vehicle, driver and number of issues and asks the driver to confirm.
- If someone else already checked that vehicle in from another phone, the page says so and refreshes the list.

### Either way

- If saving fails, everything stays on the screen so the driver can try again.
- The page picks up changes from the sheet (vehicles checked in or out on other phones, new drivers, the vehicle list) each time it opens or comes back to the front.
- A wrong driver code is rejected and the page asks for it again. After 20 wrong codes within 10 minutes, from any phones, the script stops accepting requests for 10 minutes, so nobody can guess the code by trying numbers.

## The emails

Everyone on the **Notify Emails** tab gets an email right away each time a vehicle is checked out and each time it's checked in.

### Check-out

- The subject reads **Vehicle Sign-Out Log: Bus 25 checked out, John Smith (Thu, Oct 29)**, with the trip date.
- The email shows the driver, the trip date, and when it was checked out.
- If the vehicle was still out on an earlier trip that nobody checked in, the email has an orange note naming that driver and saying the trip was marked *Not checked in*.

### Check-in

- When no issues are reported, the subject reads **Vehicle Sign-Out Log: Bus 25 returned, John Smith (Thu, Oct 29)**.
- When any issue is ticked, it reads **Vehicle Sign-Out Log: Repairs needed - Bus 25 returned, John Smith (Thu, Oct 29)**, so it stands out in the inbox. The issues are listed in a red box.
- The email shows who drove, the day it was checked out, when it was checked in, and who checked it in if that was someone else.
### Both

- The **Emailed** column on the Sign-Outs tab shows how each email went, such as *Check-out: Sent 11/9 4:05 PM to 2; Check-in: Sent 11/9 6:30 PM to 2*. Each part says *Sent* with the time and number of people, *Not sent* if Notify Emails has no addresses, or *Failed* with the reason. A failed email doesn't lose the check-out or check-in; it's still on the sheet.
- To stop the emails, clear the addresses on Notify Emails.

## The Sheet

- **Sign-Outs:** one row per trip. Check-out fills in the date, driver, vehicle, **Status** (*Out*), **Checked Out At** and **Emailed**. Check-in changes the status to *Returned*, fills in **Checked In At**, **Checked In By**, **Post-Trip Inspection**, **Issues** and **Issue Details**, and adds its result to **Emailed**. The **Trip ID** column is how the page finds the row at check-in; leave it alone.
  - Yellow rows are vehicles still out.
  - Orange rows are trips marked *Not checked in*, because the vehicle was checked out again before anyone checked it in.
  - Pink rows reported an issue.
- **Vehicles:** the vehicles the page shows, one per row in column A, in the order the page shows them. See "Adding or removing a vehicle" below.
- **Drivers:** the names the page suggests, in alphabetical order. To fix a misspelled name, correct it here; to take someone off the list, delete their row. Phones pick up the change the next time the page opens. Past trips keep the name as it was.
- **Notify Emails:** who gets the email.

You can sort, filter, or add your own columns to the right of Sign-Outs. The script finds its columns by their header names, so leave the tab names and the existing header names unchanged.

If a vehicle is shown as out but it's really back (nobody checked it in), change its **Status** cell to `Returned`. It drops off the Check In list the next time the page opens.

## Changing the driver code

Change the code if it gets passed around more than you'd like. In Apps Script, click the gear icon (**Project Settings**) on the left, scroll to **Script Properties**, click **Edit script properties**, change the value of **DRIVER_CODE**, and click **Save script properties**. The new code works right away; you don't need to redeploy. Each phone asks for the new code the next time the page opens. Links with the old code stop working too, so send drivers a new link.

## Adding or removing a vehicle

Vehicles are kept on the **Vehicles** tab, one per row in column A. You don't need to touch the script or redeploy.

- **New vehicle:** type its name in the next empty row, such as `Bus 40`.
- **Vehicle gone:** delete its row. Its past trips stay on the Sign-Outs tab.
- **Rename or reorder:** edit the names or move the rows. The page shows them top to bottom.

Phones show the new list a moment after the page opens. If someone submits from a page that was already open and still shows a vehicle you deleted, the page asks them to close it, open it again, and pick a vehicle. Blank rows are skipped, and a name listed twice shows once. If the tab is empty, the page says no vehicles are listed yet.

## Changing the post-trip checklist or the issue list

Both lists are near the top of `Code.gs`: the post-trip items in `POST_TRIP` and the common issues in `ISSUES`. Every post-trip item has to be ticked before a driver can check in. In the issue list, keep the item named **Other** spelled exactly that way, because it's the one that asks for details. Edit a list, then follow "Updating the script" below. The page reads both lists from the script, so it doesn't need to change.

## Updating the script

Whenever `Code.gs` changes:

1. Paste the new version into Apps Script and save.
2. Run **setup** once (step 3 above). If the new version needs a new permission, Google asks for it here.
3. Click **Deploy → Manage deployments**, then click the pencil icon. Under **Version**, choose **New version**, then click **Deploy**.

Don't use **New deployment**, because it creates a new URL and the page would stop reaching the script.

## Moving from the old sign-out form

The first version of the page had one form with both inspections on it. To switch to check-in and check-out:

1. Follow "Updating the script" above with the new `Code.gs`.
2. Publish the new `index.html` to GitHub.

Running setup adds four columns to the right of Sign-Outs: Status, Checked In At, Checked In By and Trip ID. It also renames **Submitted At** to **Checked Out At**. Past sign-outs stay as they are, with a blank status, so they don't show up as out. The old **Pre-Trip Inspection** column isn't used any more. Keep it for the past rows, or delete the whole column if you don't need them.

A phone that still has the old page open gets the message "This page has been updated" when it submits, and the new page loads the next time it's opened.
