# LearnAfrica — how to get found on Google (Business Profile) and get your website into search

This is a complete, plain-English walkthrough. You do not need any technical
background to follow it. Every button you must click is named, and every value you
must type is given to you.

There are **two separate jobs** in here, and they are not the same thing:

- **Part 1 — Google Business Profile.** This is your **business listing**. It is
  what makes "LearnAfrica" appear in Google Search and on **Google Maps**.
  **Do this part first.** ← you asked to start here
- **Part 2 — Google Search Console.** This is what gets your **website pages**
  into Google's normal search results.

Everything in this guide is **free**. You do **not** need to buy anything, and you
do **not** need a business email address. Your normal Gmail
(`ksm.institute1@gmail.com`) is all you need to sign in.

> **Read this first if you read nothing else:** the Business Profile (Part 1) is
> the one that puts you on the map. The Search Console (Part 2) is the one that
> puts your web pages in the results. They are independent — doing one does not do
> the other. Do both.

---

# Part 1 — Google Business Profile (do this first)

## 1.1 What this is, in one minute

A **Google Business Profile** is a free page about your business that Google shows
on the right-hand side of search results, and as a pin on Google Maps. When
somebody types **"LearnAfrica"** (or "learn coding Ghana" and you are near them),
this is what Google can show:

- your business name and logo,
- your website link,
- your phone number,
- your opening hours,
- photos you uploaded,
- student reviews and your replies,
- a **Directions** button that opens Google Maps.

It is separate from your website. Your website is the shop; the Business Profile
is the signboard on the street that points to the shop.

## 1.2 The one rule you must understand before you start

Google has a rule about who is allowed a Business Profile. Read it carefully,
because it decides how you set yours up:

> A Business Profile is for businesses that meet customers **in person** — either
> at the business's own location, or at the customer's location (for example, a
> plumber who drives to your house).

There are therefore **three cases**. Pick the one that is true for LearnAfrica
**today**:

| Case | Is it true for you? | What you get |
|---|---|---|
| **A. You have a place people can come to** — an office, a classroom, a training centre with a real address |  | A **storefront** profile. You get a **pin on Google Maps**. Best result. |
| **B. You do not have a place, but you go to students** — you run in-person sessions somewhere in Ghana, or you travel to teach |  | A **service-area business**. You show in Search and for your area, but with **no Maps pin**. |
| **C. You are 100% online** — no address, no in-person sessions at all, everything is over the internet |  | You are **not eligible**. Google may reject or suspend the profile. Skip to **Part 1.10** (the fallback). |

**Decide now which of A, B or C is you.** The rest of Part 1 assumes **A or B**.
If you are **C**, read **1.10** and then go to Part 2.

> If you are not sure: ask yourself "if a student wanted to meet me face to face,
> where would that happen?" If there is an answer, you are A or B. If the honest
> answer is "nowhere, it is all online", you are C.

## 1.3 What you need to have ready before you start

Have these open or written down. This is everything; nothing else is required.

| What | Value / where to find it |
|---|---|
| A Google account | `ksm.institute1@gmail.com` (sign in with this) |
| Business name (exactly as it should appear) | **LearnAfrica** |
| Website address | `https://learnafrica-lite-weld.vercel.app` (or your custom domain) |
| A phone number | Your business phone, e.g. the number students already call |
| Category | **Online education** (or **Educational institution** / **Training centre** if you have a physical place) |
| Address (case A only) | The full street address, including town and region |
| Service area (case B only) | The area you serve, e.g. **Ghana** |
| Logo file | `frontend/public/logo.png` (square; also `logo-dark-512.png` is available) |
| Cover photo file | `frontend/public/hero-community.jpg` |
| Extra photos (optional but good) | `frontend/public/feature-student.jpg`, `student1.jpg` … `student5.jpg`, `carousel-collab.jpg`, `carousel-lab.webp`, `carousel-library.webp`, `tech-skills.jpg` |
| A short description | 2–3 sentences about LearnAfrica (you can write this in the wizard) |

All of those image files are already inside the project in the `frontend/public/`
folder. Open that folder on your computer and keep it handy — you will upload some
of them later.

## 1.4 Step by step: create the profile

Do this on a computer (it is easier than on a phone).

1. Open your web browser and go to **<https://www.google.com/business/>**.
2. Sign in with **`ksm.institute1@gmail.com`**.
3. Click the blue button that says **Manage now** (or **Add your business**).
4. **Business name.** Type exactly:
   ```
   LearnAfrica
   ```
   Type it the way you want customers to see it. Do **not** stuff keywords into it
   (for example do not write "LearnAfrica Best Online Courses Ghana"). Google
   rejects names like that. Just **LearnAfrica**.
5. Click **Next**.
6. **Business category.** Start typing and choose the closest match:
   - If you have a physical place: **Training centre** or **Educational institution**.
   - If you are online/service-area: **Online education** or **Education centre**.
   You can add more categories later. Choose one now and click **Next**.
7. **Location.** This screen changes depending on case A or B above:
   - **Case A (you have a place):** type your full address. Move the map pin to
     the exact spot. Click **Next**.
   - **Case B (you go to students):** look for the option **"I deliver goods and
     services to my customers"** and tick it. Google then **hides your street
     address** and asks for a **service area** instead. Enter **Ghana** (or your
     region, e.g. Greater Accra). Click **Next**.
8. **If you serve customers at your place too** (case A), Google may ask if you
   also want to add a service area. You can skip or add **Ghana**. Click **Next**.
9. **Contact details.** Two boxes:
   - **Phone number:** type your business phone.
   - **Website:** type your website address:
     ```
     https://learnafrica-lite-weld.vercel.app
     ```
     (or your custom domain). It is completely fine that the website address is
     different from the business name. They are separate things.
   Click **Next**.
10. Google will now ask you to **verify** the business. See the next section — do
    not close the window before reading it.
11. Click **Finish** / **Continue**.

At this point the profile exists but is **not public yet**. Nothing shows on Google
until verification passes.

## 1.5 Verification — the important part

Google must confirm that the business is really yours before it will show it to the
public. Depending on your case, Google will offer one or more of these:

| Method | How it works | Notes |
|---|---|---|
| **Postcard by mail** | Google mails a postcard with a code to your address | Most common for a storefront. Takes about **2 weeks**. Do not request a new one too soon or you reset the timer. |
| **Phone** | An automated call or text gives you a code | Offered sometimes, not always. |
| **Email** | A code is emailed to you | Offered sometimes. |
| **Video** | You record a short video of your premises, signage and equipment | Offered for some businesses; follow the on-screen script. |

What to do:

1. Choose the method Google offers you.
2. If it is a **postcard**, wait for it, then come back to
   <https://www.google.com/business/> → your profile → **Verify now** → type the
   code from the card.
3. If it is a **phone/email code**, type the code when it arrives.
4. If it is a **video**, record exactly what the instructions ask for.

**If verification fails or you never receive the postcard**, open the profile and
use **"Verify now" → "Request another code"**, or contact Google Business Profile
support from that same screen.

> Nothing you do before verification is wasted — all the details and photos you add
> are kept and appear the moment verification succeeds.

## 1.6 Fill the profile in properly (this is what makes it show up)

A verified but empty profile ranks poorly. Do all of this:

1. **Logo.** Click **Add logo** and upload `frontend/public/logo.png`.
   (A square image; `logo-dark-512.png` also works.)
2. **Cover photo.** Click **Add cover photo** and upload
   `frontend/public/hero-community.jpg`.
3. **More photos.** Add the other images from `frontend/public/` — students,
   the classroom/lab shots, `feature-student.jpg`. Real photos perform better than
   graphics. Add at least 5–10.
4. **Description.** Click **Edit profile → Description** and write 2–3 plain
   sentences, for example:
   > LearnAfrica is an online learning platform for African students. We offer
   > affordable, expert-led courses in technology, data and business skills,
   > with certificates on completion.
5. **Opening hours.** Set your hours. If you teach at set times, use those. If you
   are always reachable online, set broad hours and tick **Online appointments**
   under attributes.
6. **Attributes.** Under **Edit profile**, turn on things that are true, such as
   **Online appointments**, **Online classes**, **Wheelchair accessible** (only if
   true).
7. **Products / Services.** Add the courses you sell as **Services** (for example
   "Python for Data Science"). Each can have a short description and a price.
8. **Phone and website.** Double-check both are correct and the website link opens.
9. **Messaging (optional).** You can turn on chat so students can message you
   through Google.

## 1.7 What it looks like once it is live

After verification, search **LearnAfrica** on Google. You should see a panel on the
right (desktop) or a card (phone) with your logo, photos, hours, website, phone and
a **Directions** link. If you registered as a **storefront** (case A), the pin also
appears on **Google Maps**. If you registered as a **service-area business**
(case B), you appear in Search and for your service area but **without a pin** —
that is expected and correct.

## 1.8 Reviews — the single biggest driver

Reviews move you up and build trust.

- After a student finishes a course, ask them politely to leave a review. You can
  send them the short review link from your profile (there is an **"Ask for
  reviews"** button that gives you a link or QR code).
- **Reply to every review**, good or bad. A calm, helpful reply to a bad review
  often impresses people more than a good one.
- Never buy fake reviews. Google detects them and suspends profiles for it.

## 1.9 Posts — stay active

Every week or two, click **Add update / Post** and publish something short: a new
course, a student success, a tip. Google favours profiles that are alive. You can
add a photo and a button that links to your website.

## 1.10 If you are 100% online (case C) and get rejected

If you have no physical location and no in-person sessions, Google may refuse the
profile. That is the rule in **1.2**, and it is not a mistake on your side. When
that happens, you are not out of options:

1. **Do Part 2 below.** Search Console gets your **website pages** into Google
   search results — that alone means "LearnAfrica" can appear when people search.
2. **Publish helpful blog posts** on your site (you already have a blog at
   `/blog`). Articles like "How to start learning data science in Ghana" are what
   rank for the searches your students actually type.
3. **Get other websites to link to you** — partner schools, directories, your
   social media bios, YouTube descriptions. These links help a lot.
4. **Come back to Part 1 later.** If you ever get an office or start running
   in-person sessions, you become eligible and can create the profile then.

---

# Part 2 — Get your website into Google (Search Console)

Part 1 was about your **business**. Part 2 is about your **website pages**. This is
what makes individual pages (your home page, courses, instructors, blog) show up in
normal Google search results.

## 2.1 What is already done in the code (you do not need to touch these)

The project already ships the things search engines look for:

- `frontend/public/robots.txt` — tells crawlers what to read and where the sitemap is.
- `frontend/public/sitemap.xml` — a same-host list of your main public pages
  (`/`, `/courses`, `/instructors`, `/blog`).
- `frontend/src/lib/seo.js` — sets each page's title, description, canonical link
  and rich-result data automatically.
- Backend `GET /api/sitemap.xml` — a **dynamic** sitemap that also lists every
  published course, approved instructor and blog post.

So the groundwork is there. What remains is **registering the site with Google**
and telling it your public address.

## 2.2 Tell the backend your public address (`SITE_URL`)

The dynamic sitemap needs to know your frontend address so its links are complete.

1. Go to **<https://dashboard.render.com>** and open your **backend** service.
2. Click **Environment** (left menu).
3. Click **Add Environment Variable** and enter:
   - Key: `SITE_URL`
   - Value: `https://learnafrica-lite-weld.vercel.app` (no trailing slash; use
     your custom domain if you have one)
4. Click **Save changes**. Render will redeploy automatically (wait for it to say
   **Live**).
5. Test it: open your backend URL with `/api/sitemap.xml` on the end, for example
   ```
   https://<your-backend>.onrender.com/api/sitemap.xml
   ```
   You should see lines beginning `<loc>https://learnafrica-lite-weld.vercel.app/`
   — proof the addresses are complete.

## 2.3 Create the Search Console property

1. Open **<https://search.google.com/search-console>**.
2. Sign in with **`ksm.institute1@gmail.com`**.
3. Click **Add property** (top-left dropdown, or the button on the welcome screen).
4. Two options appear. Choose **URL prefix** (not "Domain").
5. In the box, type your full website address **including `https://`**:
   ```
   https://learnafrica-lite-weld.vercel.app
   ```
6. Click **Continue**.

## 2.4 Verify that you own the site

Google must be sure the site is yours. The easiest method for Vercel is the HTML
tag. Steps:

1. On the verification screen, click to expand **HTML tag**.
2. Google shows a line like:
   ```html
   <meta name="google-site-verification" content="xxxxxxxxxxxxxxxx" />
   ```
   Click **Copy**.
3. Open the file **`frontend/index.html`** in your project.
4. Paste the copied line inside the `<head>` section, for example right after the
   `<title>` line:
   ```html
   <head>
     <meta charset="UTF-8" />
     ...
     <title>LearnAfrica — Online Learning for Africa</title>
     <meta name="google-site-verification" content="xxxxxxxxxxxxxxxx" />
   </head>
   ```
5. Save the file, commit it, and let **Vercel** deploy it (or upload it the same
   way you normally update the site).
6. Back in Search Console, click **Verify**.
7. You should see **"Ownership verified"**.

*Alternative method (DNS):* if you have a custom domain, Search Console can instead
give you a **TXT record** to add at your domain registrar (where you bought the
domain). This is more robust but involves the registrar's dashboard. The HTML tag
is simpler for now.

## 2.5 Submit your sitemap

1. In Search Console, click **Sitemaps** in the left menu.
2. In the **"Add a new sitemap"** box, type just:
   ```
   sitemap.xml
   ```
3. Click **Submit**.
4. Status should change to **Success**. If it says **Couldn't fetch**, open
   `https://learnafrica-lite-weld.vercel.app/sitemap.xml` in a browser — it must
   show XML (text with `<url>` tags), not a normal web page. If it shows a web
   page, the `frontend/public/sitemap.xml` file did not deploy — redeploy the
   frontend.

## 2.6 Ask Google to index your important pages

Indexing is not instant. To speed it up:

1. Click **URL Inspection** at the top.
2. Paste your home page URL and press Enter.
3. Click **Request indexing**.
4. Repeat for:
   - `https://learnafrica-lite-weld.vercel.app/`
   - `https://learnafrica-lite-weld.vercel.app/courses`
   - `https://learnafrica-lite-weld.vercel.app/instructors`
   - `https://learnafrica-lite-weld.vercel.app/blog`

You can only request a handful per day; that is normal.

## 2.7 Check back after a few days

Open Search Console → **Pages**. This tells you:

- **Indexed** — Google has added the page. Good.
- **Not indexed** — with a reason (for example "Discovered — currently not
  indexed", which just means wait). Fix anything that says **Error**.

---

# Part 3 — Bing Webmaster Tools (free, 2 minutes)

Bing also powers some other search engines, so this is worth doing.

1. Open **<https://www.bing.com/webmasters>** and sign in.
2. Click **Import from Google Search Console** and approve the connection. This
   copies your verified site and your sitemap across automatically — no manual
   work.
3. If you prefer manual: **Add site** → verify (it can also use the same HTML tag)
   → **Sitemaps** → submit `sitemap.xml`.

---

# Part 4 — Optional: free visitor statistics (Google Analytics 4)

This does **not** affect ranking. It just tells you how many people visit and what
they do. Skip it if you do not want it.

1. Open **<https://analytics.google.com>**.
2. Click **Admin** → **Create** → **Property**. Give it a name (LearnAfrica) and
   your time zone and currency.
3. Create a **Web** data stream with your website address.
4. Google gives you a **Measurement ID** that looks like `G-XXXXXXXXXX` and a small
   code snippet.
5. Paste the snippet into **`frontend/index.html`** inside `<head>`, then deploy.
6. In Analytics, open **Reports → Realtime** and visit your own site — you should
   see yourself appear, which proves it works.

---

# Part 5 — Keeping it healthy

- Re-check **Sitemaps** in Search Console after you add many new courses or posts.
- Watch **Pages** for errors and fix them.
- Keep adding useful **blog content** — it is the main thing that wins searches.
- Keep your **Business Profile** fresh: new photos, a post every week or two,
  and reply to every review.
- When you publish an important new page, use **URL Inspection → Request indexing**.

---

# Quick checklist

**Business Profile (Part 1)**
- [ ] Decided case A (storefront), B (service area) or C (online-only)
- [ ] Created the profile with the name **LearnAfrica**
- [ ] Category chosen
- [ ] Address **or** service area entered
- [ ] Phone and website added
- [ ] Verified
- [ ] Logo (`logo.png`) and cover (`hero-community.jpg`) uploaded
- [ ] Description, hours and attributes set
- [ ] Services added
- [ ] First post published

**Website in search (Part 2)**
- [ ] `SITE_URL` set on Render and `/api/sitemap.xml` shows full URLs
- [ ] Search Console property added
- [ ] Ownership verified
- [ ] `sitemap.xml` submitted (status Success)
- [ ] Home, /courses, /instructors, /blog submitted for indexing
- [ ] Checked **Pages** after a few days

**Extra**
- [ ] Bing Webmaster Tools set up
- [ ] (Optional) Google Analytics installed

---

# Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Business Profile rejected or suspended | You may be online-only (case C). See Part 1.10. If you do have a location, use the **appeal** link on the rejection and add proof (photos of signage). |
| Business not showing on Maps | Service-area businesses get no pin — expected. A storefront address gets one. |
| Never received the postcard | In the profile, **Verify now → Request another code**. Wait the full ~2 weeks before requesting again. |
| Search Console says "Couldn't fetch" the sitemap | The sitemap must be on the **same host** as the site and return XML. Open `https://<your-site>/sitemap.xml` — if it shows a web page instead of XML, redeploy the frontend so `public/sitemap.xml` ships. |
| Sitemap URLs are relative / rejected | `SITE_URL` is not set on Render, or the backend has not redeployed since you set it. |
| Site not in results after a week | Use **URL Inspection → Request indexing**. Confirm `robots.txt` is not blocking the page (it should only block `/admin`, `/dashboard`, `/instructor`, `/learn`, `/payment`). |
| Wrong title or description in results | Search engines cache old text. Give it time, and make sure the page uses the SEO helper. |
| Google shows a different name than "LearnAfrica" | Google sometimes shows your site name from the homepage. Keep the name consistent in the site title, logo and profile. |

---

# Appendix A — If you later buy a custom domain

1. Add the domain in **Vercel → your project → Settings → Domains** and follow the
   DNS instructions.
2. Update `SITE_URL` on **Render** to the new domain.
3. Edit the host inside **`frontend/public/sitemap.xml`** and the `Sitemap:` line
   in **`frontend/public/robots.txt`** to the new domain.
4. In Search Console, add the new domain as a **new property** and verify it, then
   submit the sitemap there too.
5. In your **Business Profile**, update the **Website** field to the new domain.
6. Redeploy the frontend and the backend.

---

# Appendix B — Do you need a paid business email?

No. You can create and run the Google Business Profile and Search Console with your
normal Gmail (`ksm.institute1@gmail.com`). A paid **Google Workspace** account only
gives you a professional address like `you@yourdomain.com`; it is not required for
being found on Google. Buy it later if you want the polish, not for SEO.

---

# Appendix C — Plain-English glossary

| Word | What it means |
|---|---|
| **Business Profile** | Your free business listing in Google Search and Maps. |
| **Search Console** | Google's free tool that shows how your website performs in search and lets you submit your sitemap. |
| **Sitemap** | A file that lists your pages so Google can find them all. |
| **robots.txt** | A file that tells crawlers which pages to read or skip. |
| **Index / indexing** | Google adding a page to its searchable database. Until a page is indexed, it cannot appear in results. |
| **Crawl** | Google's robot reading your pages to discover them. |
| **Storefront** | A business customers visit at your address → gets a Maps pin. |
| **Service-area business** | A business that goes to customers → no Maps pin. |
| **`SITE_URL`** | An environment variable on Render that tells the backend your public website address. |
| **Canonical URL** | The one "official" address of a page, so Google does not treat duplicates as separate. |
