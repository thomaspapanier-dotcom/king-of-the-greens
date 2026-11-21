# Making the Queen and skin-tone art automatically

A script sends each badge and banner to OpenAI's image API (the same kind of image model ChatGPT uses) and saves the new versions for you. You only check the results.

**What it makes:** for every badge and banner that shows a King (107 banners and 9 badges):
- King in **Brown** and **Black** skin
- Queen in **White**, **Brown** and **Black** skin

It also makes the Brown and Black versions of the four Queen cards. In total that's about **550 images**: 216 King images can be made right away, and the Queen ones once the four Queen cards exist.

## One-time setup (about 10 minutes)

1. **Make an OpenAI developer account** at [platform.openai.com](https://platform.openai.com). This is separate from your ChatGPT subscription.
2. **Add a payment method** under *Settings → Billing*. Adding a set amount of credit (for example $20 to start) instead of turning on auto-recharge means it can never spend more than you put in.
3. **Verify your organization** if it asks (*Settings → Organization → Verify*). OpenAI requires this before its image models can be used through the API.
4. **Create an API key**: *API keys → Create new secret key*. Copy it.
5. **Save the key on your computer**, so the script can read it:
   - Open **Notepad**, paste the key, and save the file as `openai-key.txt` in the folder `C:\Users\thoma\.kog` (it's already created for you).
   - In Notepad's Save box, set "Save as type" to **All files**, so it doesn't become `openai-key.txt.txt`.

**Keep the key private.** Don't paste it into a chat (including this one), an email or a document. If it ever leaks, delete it on the API keys page and make a new one. The script reads it from that file and never shows it.

## Then

1. Tell me the key is saved. I'll make a **3-image test** first (it costs well under $1), show you the results, and tell you the real cost per image from OpenAI's bill for those three.
2. If you like them, I run the 216 King images. It runs in the background and takes a few hours.
3. **Queens:** make the four Queen cards in ChatGPT ([docs/QUEENS.md](QUEENS.md)) and save them as `queen-spades.png`, `queen-hearts.png`, `queen-clubs.png` and `queen-diamonds.png` in the KOG Images folder. Then the script makes their Brown and Black cards and every Queen badge and banner.
4. **Review:** I build a review page that shows every original next to its new versions. Tick any that came out wrong and press *Copy redo list*; I re-make just those.

## For reference: the commands

```powershell
python tools/make_art_variants.py --dry-run
```
```powershell
python tools/make_art_variants.py --limit 3
```
```powershell
python tools/make_art_variants.py
```
```powershell
python tools/add_tone_art.py
```
```powershell
python tools/review_art.py
```

- **Settings:** the model (`--model`, default `gpt-image-2.6-sunburst`, OpenAI's model for precise edits) and quality (`--quality`, default `medium`) can be changed.
- **Cost log:** every image's real cost is written to `KOG Images/Generated/log.csv`.
- **Failures:** anything that fails is logged and skipped; run the script again to retry, or use `--redo name1,name2` for specific ones.
