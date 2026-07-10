// Content for the data-driven SEO landing pages, keyed by route id (see ../routes.data.js).
// Each entry feeds ToolLanding.svelte: the page copy, the sections, the FAQ (which also becomes
// the FAQPage JSON-LD via seo.ts, so on-page text and schema can never drift) and the tool
// preset the embedded <Tool> starts with. Adding a landing page = one routes.data.js entry +
// one entry here. test/routes.test.ts enforces the integrity rules (unique titles/h1s/FAQ
// questions, lead length, valid preset keys, cross-link targets exist, …).
//
// Copy rules: leads are keyword-led and ≥ ~60 words; every claim must be true of the real tool
// (no cropping, no upscaling, GIF is first-frame only); UK spelling ("optimise") except inside
// established format names. Every page carries its OWN angle, step set and table — pages must
// never read as the same template with nouns swapped, or they'll compete for (and rank for)
// the same queries.
import type { UiOpts } from '../persist';
import type { Faq } from '../seo';
import { NO_RESIZE } from '../../core/presets';

export type LandingSection =
  | { type: 'prose'; h2: string; sub?: string; paragraphs: string[]; bullets?: string[] }
  | { type: 'steps'; h2: string; steps: { title: string; body: string }[] }
  | { type: 'factTable'; h2: string; sub?: string; columns: string[]; rows: string[][] }
  | {
      type: 'comparison';
      h2: string;
      competitor: string;
      rows: { feature: string; scalir: string; other: string }[];
      verdict: string;
    }
  | { type: 'crossLinks'; h2: string; links: { path: string; label: string; blurb?: string }[] };

export interface LandingContent {
  h1: string;
  lead: string;
  toolPreset?: Partial<UiOpts>;
  toolNote?: string;
  sections: LandingSection[];
  faq: Faq[];
}

// Convert pages must not silently resize or squeeze: full dimensions, generous size budget, so
// the result is simply "the same image in the new format" (encoded at the top of the quality
// ladder). Compress pages keep the aggressive defaults instead — that's their whole point.
const CONVERT_PRESET: Partial<UiOpts> = { maxDim: NO_RESIZE, maxMB: 10 };

export const LANDING_CONTENT: Record<string, LandingContent> = {
  // ── Convert ─────────────────────────────────────────────────────────────────────────────
  'convert-heic-to-jpg': {
    h1: 'Convert HEIC to JPG — iPhone photos, opened everywhere',
    lead:
      'Your iPhone shoots HEIC to save space, and then Windows, an older editor or a web form ' +
      'shrugs at the file. Scalir turns HEIC into JPG on your own device: drag in a single ' +
      'photo or an entire camera roll and universally compatible JPGs come back in seconds. ' +
      'Nothing installs, nothing uploads — family photos and private pictures never leave your ' +
      'computer.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'jpeg' },
    toolNote: 'Preconfigured for HEIC → JPG at full size — tweak anything below.',
    sections: [
      {
        type: 'steps',
        h2: 'From camera roll to JPG in three steps',
        steps: [
          {
            title: 'Add your iPhone photos',
            body: 'AirDrop, cable or cloud folder — get the HEICs onto your computer, then drag them in. Bursts, screenshots and Live Photo stills all decode.',
          },
          {
            title: 'Convert the lot',
            body: 'JPEG output at the original resolution is already selected. One click converts the whole batch in parallel, on your own CPU.',
          },
          {
            title: 'Save or share',
            body: 'Download photos one by one, as a single ZIP, or straight into a folder — ready for Windows, old editors and every upload form.',
          },
        ],
      },
      {
        type: 'factTable',
        h2: 'HEIC vs JPG at a glance',
        columns: ['', 'HEIC', 'JPG'],
        rows: [
          ['Made by', 'Apple (default since iOS 11)', 'Everyone — the universal standard'],
          ['Opens on', 'Apple devices; Windows only with extensions', 'Every device, browser and app'],
          ['File size', 'Smaller at the same quality', 'Larger, but compatible everywhere'],
          ['Best for', 'Storing photos on your phone', 'Sharing, uploading and editing'],
        ],
      },
      {
        type: 'prose',
        h2: 'Why iPhones shoot HEIC — and when JPG wins',
        paragraphs: [
          'HEIC packs the same photo into roughly half the space of JPEG, which is exactly what a phone with a full camera roll wants. The trouble starts off-device: Windows often demands paid codecs, older versions of Photoshop and Lightroom refuse the format, and countless job portals, printing services and CMS uploaders only accept JPG or PNG.',
          'Most "HEIC converter" sites work by uploading your photos to their server first. Scalir never does — the HEIC decoder is WebAssembly running in your browser, so the conversion is private by construction, and EXIF metadata (including GPS location) is stripped from the JPGs it produces.',
        ],
      },
      {
        type: 'prose',
        h2: 'Prefer JPG straight from the camera?',
        paragraphs: [
          'If you would rather not convert at all, your iPhone can shoot JPG natively: Settings → Camera → Formats → "Most Compatible". The trade-off is photos that take roughly twice the storage — which is why many people keep HEIC on the phone and convert on demand instead.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'Related tools',
        links: [
          { path: '/compress-jpeg', label: 'Compress JPEG', blurb: 'Get the converted photos under a size limit.' },
          { path: '/compress-image-to-100kb', label: 'Compress to 100KB', blurb: 'iPhone photo → form-ready upload.' },
          { path: '/download', label: 'Desktop app', blurb: 'Convert HEIC offline on Windows and Linux.' },
          { path: '/features', label: 'All features', blurb: 'Resize, target-size compression and more.' },
        ],
      },
    ],
    faq: [
      {
        q: 'Why are my iPhone photos HEIC?',
        a: 'Since iOS 11, iPhones default to HEIC (High Efficiency Image Container) because it stores the same photo in roughly half the space of JPEG. You can change the default under Settings → Camera → Formats, but converting only when you need JPG keeps the storage benefit.',
      },
      {
        q: 'Does converting HEIC to JPG lose quality?',
        a: 'JPEG is a lossy format, but Scalir converts at quality 95 and full resolution by default, so the difference is invisible in normal use. You can check any photo in the before/after preview and adjust quality per image.',
      },
      {
        q: 'Can I convert a whole folder of HEIC files at once?',
        a: 'Yes. Scalir is a bulk converter: drop in hundreds of HEIC photos or pick a folder, and they are converted in parallel across your CPU cores, then downloaded as a ZIP or saved straight to a folder.',
      },
      {
        q: 'Do my HEIC photos get uploaded anywhere?',
        a: 'No. The HEIC decoder runs in your browser via WebAssembly, so photos are converted on your own device and nothing is ever uploaded. The site even works offline once it has loaded.',
      },
    ],
  },

  'convert-webp-to-jpg': {
    h1: 'Convert WebP to JPG — open your images anywhere',
    lead:
      'You right-click-saved an image and got a .webp that Photoshop, your photo frame or an ' +
      'upload form refuses to touch. Scalir fixes that in one drag: it re-encodes WebP as ' +
      'standard JPG locally, in your browser, with no account and no upload. One file or a ' +
      'folder of hundreds — the JPGs come back in seconds and open in absolutely everything.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'jpeg' },
    toolNote: 'Preconfigured for WebP → JPG at full size — tweak anything below.',
    sections: [
      {
        type: 'prose',
        h2: 'Where all these WebP files come from',
        paragraphs: [
          'Most big sites now serve WebP because it is smaller than JPEG — so when you save an image from the web, WebP is what lands in your downloads folder, whatever the page visually showed you. CDNs even convert on the fly: the site owner uploaded a JPG, your browser received a WebP.',
          'That is fine until the file meets software from before the WebP era — older Photoshop, embroidery and print software, digital photo frames, or the stricter kind of upload form. Converting back to JPG is the universal escape hatch, and doing it locally means the image is never bounced through someone else\'s server on the way.',
        ],
      },
      {
        type: 'steps',
        h2: 'Turn WebP into JPG in three steps',
        steps: [
          {
            title: 'Drop in the WebP files',
            body: 'Straight from your downloads folder — single images or the whole thing at once.',
          },
          {
            title: 'Re-encode locally',
            body: 'JPEG output is preset at the original size and quality 95. Transparent areas, if any, are flattened (JPG has no transparency).',
          },
          {
            title: 'Use the JPGs anywhere',
            body: 'Every app, editor, form and device on earth accepts JPG. Download singles or grab the batch as a ZIP.',
          },
        ],
      },
      {
        type: 'factTable',
        h2: 'Will it open? WebP vs JPG compatibility',
        columns: ['', 'WebP', 'JPG'],
        rows: [
          ['Browsers', 'All modern browsers', 'Everything, ever'],
          ['Photo editors', 'Recent versions only', 'All of them, any age'],
          ['Upload forms & CMSs', 'Often rejected', 'Universally accepted'],
          ['Devices (frames, TVs, kiosks)', 'Hit and miss', 'Reliable'],
        ],
      },
      {
        type: 'crossLinks',
        h2: 'Related tools',
        links: [
          { path: '/convert/webp-to-png', label: 'WebP to PNG', blurb: 'Pick PNG when transparency must survive.' },
          { path: '/compress-jpeg', label: 'Compress JPEG', blurb: 'Shrink the JPGs to a size target.' },
          { path: '/convert/jpg-to-webp', label: 'JPG to WebP', blurb: 'The reverse trip, for your own website.' },
          { path: '/', label: 'Bulk image compressor', blurb: 'The full tool, no preset.' },
        ],
      },
    ],
    faq: [
      {
        q: "Why can't I open WebP files?",
        a: 'WebP is a modern web format that older versions of Photoshop, some photo viewers, printing services and many upload forms still do not accept. Converting to JPG gives you a file that opens everywhere.',
      },
      {
        q: 'How do I convert WebP to JPG without installing anything?',
        a: 'Use Scalir in your browser: drop the WebP files on this page, hit Optimise and download your JPGs. Nothing is installed and nothing is uploaded — the conversion runs locally on your device.',
      },
      {
        q: 'Will converting WebP to JPG reduce quality?',
        a: 'Scalir re-encodes at quality 95 by default, which is visually indistinguishable for photos. JPG does not support transparency though — transparent areas are flattened, so convert to PNG if you need them kept.',
        href: '/convert/webp-to-png',
        linkText: 'Convert WebP to PNG instead',
      },
      {
        q: 'Can I convert multiple WebP images at once?',
        a: 'Yes — drop in as many as you like or choose a whole folder. Files are converted in parallel across your CPU cores and you can grab everything as a single ZIP.',
      },
    ],
  },

  'convert-webp-to-png': {
    h1: 'Convert WebP to PNG — a pixel-perfect copy, transparency intact',
    lead:
      'When an image is going back into an editing pipeline — Figma, Photoshop, a slide deck, ' +
      'an app-store listing — you want lossless, and that means PNG. Scalir converts WebP to ' +
      'PNG with every pixel and the full alpha channel preserved, entirely on your device. ' +
      'Designers can drop in a folder of exported assets and get back PNGs that behave exactly ' +
      'like the originals, minus the compatibility arguments.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'png' },
    toolNote: 'Preconfigured for WebP → PNG at full size — tweak anything below.',
    sections: [
      {
        type: 'factTable',
        h2: 'Which format for which job?',
        sub: 'PNG and WebP overlap — this is how to choose.',
        columns: ['You are…', 'Use'],
        rows: [
          ['Editing the image again (layers, retouching)', 'PNG — lossless survives repeated saves'],
          ['Submitting to an app store or marketplace', 'PNG — the required format almost everywhere'],
          ['Placing it in a document or slide deck', 'PNG — renders identically in every office suite'],
          ['Serving it on a web page', 'WebP — same transparency, far fewer bytes'],
          ['Archiving a master copy', 'PNG — pixel-exact, universally readable in 20 years'],
        ],
      },
      {
        type: 'steps',
        h2: 'How the conversion works',
        steps: [
          {
            title: 'Drop in WebP assets',
            body: 'Logos, stickers, UI exports, screenshots — anything with or without transparency.',
          },
          {
            title: 'Lossless re-encode',
            body: 'PNG output is preset. The decode → encode round trip is exact: same pixels, same alpha, no quality dial involved.',
          },
          {
            title: 'Collect the PNGs',
            body: 'Individually, zipped, or written into a folder — drop them straight into your design tool.',
          },
        ],
      },
      {
        type: 'prose',
        h2: 'Expect the PNG to be bigger — that is the deal',
        paragraphs: [
          'PNG guarantees a perfect copy of every pixel, and that guarantee costs bytes: the PNG will usually be larger than the WebP it came from. For editing, archiving and submitting that is exactly the right trade. If the file is ultimately heading back to a website, keep the WebP for serving and use the PNG as your working copy.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'Related tools',
        links: [
          { path: '/compress-png', label: 'Compress PNG', blurb: 'When the lossless copies get heavy.' },
          { path: '/convert/png-to-webp', label: 'PNG to WebP', blurb: 'Send finished assets back to the web.' },
          { path: '/convert/webp-to-jpg', label: 'WebP to JPG', blurb: 'No transparency? JPG is smaller.' },
          { path: '/self-hosting', label: 'Self-host Scalir', blurb: 'Run the converter inside your studio.' },
        ],
      },
    ],
    faq: [
      {
        q: 'Does WebP to PNG keep transparency?',
        a: 'Yes. PNG supports full alpha transparency and Scalir carries it across exactly — transparent logos, stickers and UI assets stay transparent, edge pixels included.',
      },
      {
        q: 'Is PNG bigger than WebP?',
        a: 'Usually, yes. PNG is a strictly lossless format and typically comes out larger than the WebP you started with — that is the cost of universal support and pixel-perfect fidelity.',
      },
      {
        q: 'When should I convert WebP to PNG?',
        a: 'Whenever a tool refuses WebP or you need a lossless working copy: image editors, document templates, app-store listings and stricter upload forms. PNG is the safest lossless format for compatibility.',
      },
      {
        q: 'Does converting WebP to PNG improve quality?',
        a: 'No — conversion cannot invent detail that was already compressed away. What PNG gives you is a guarantee that nothing further is lost, no matter how many times the file is opened and saved.',
      },
    ],
  },

  'convert-png-to-webp': {
    h1: 'Convert PNG to WebP — the pagespeed audit fix',
    lead:
      'When Lighthouse says "serve images in next-gen formats", this is the page it means. ' +
      'PNGs are routinely the heaviest files on a site, and converting them to WebP cuts ' +
      '60–90% of the weight while keeping full alpha transparency. Scalir batch-converts an ' +
      'entire asset folder in your browser — no build plugin, no upload, no account — so the ' +
      'fix takes about a minute.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'webp' },
    toolNote: 'Preconfigured for PNG → WebP at full size — tweak anything below.',
    sections: [
      {
        type: 'factTable',
        h2: 'What PNG → WebP typically saves',
        sub: 'Real-world ranges by image type, at visually identical quality.',
        columns: ['Image type', 'Typical saving'],
        rows: [
          ['UI screenshots', '80–90%'],
          ['Logos and icons with transparency', '60–80%'],
          ['Illustrations and graphics', '70–85%'],
          ['Photos accidentally saved as PNG', '90%+'],
        ],
      },
      {
        type: 'steps',
        h2: 'Fix the audit in three steps',
        steps: [
          {
            title: 'Drag in your image folder',
            body: 'Point Scalir at the assets directory — every PNG in it queues up at once.',
          },
          {
            title: 'Convert to WebP',
            body: 'Output is preset to WebP at original dimensions; alpha channels convert automatically. All cores, all files, in parallel.',
          },
          {
            title: 'Swap them into your site',
            body: 'Save the batch to a folder, update the file extensions in your markup, and re-run the audit.',
          },
        ],
      },
      {
        type: 'prose',
        h2: 'Why this moves your Core Web Vitals',
        paragraphs: [
          'Image bytes dominate most page weights, and the Largest Contentful Paint element is usually an image. Cutting the heaviest format on the page by two-thirds or more shows up directly in LCP, in bandwidth bills, and in how the page feels on a phone connection.',
          'WebP has shipped in every major browser since 2020, so there is no fallback dance left to do — you can simply serve it. Keep a lossless PNG master in your design files if you like; what the visitor downloads should be WebP.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'Related tools',
        links: [
          { path: '/convert/jpg-to-webp', label: 'JPG to WebP', blurb: 'Finish the job: photos too.' },
          { path: '/compress-png', label: 'Compress PNG', blurb: 'For the PNGs that must stay PNG.' },
          { path: '/features', label: 'All features', blurb: 'Resize modes, presets, target sizes.' },
          { path: '/self-hosting', label: 'Self-host with Docker', blurb: 'An internal converter for your team.' },
        ],
      },
    ],
    faq: [
      {
        q: 'How much smaller is WebP than PNG?',
        a: 'For typical UI graphics, logos and screenshots, expect 60–90% smaller files. Photographic PNGs shrink the most; tiny images see less benefit but still improve.',
      },
      {
        q: 'Does WebP support transparency like PNG?',
        a: 'Yes — WebP has full alpha transparency, so logos and UI elements convert with their edges intact. Scalir preserves the alpha channel automatically.',
      },
      {
        q: 'Do all browsers support WebP?',
        a: 'Every modern browser has supported WebP since 2020 — Chrome, Firefox, Safari, Edge and the mobile browsers. Only long-dead browsers like Internet Explorer do not.',
      },
      {
        q: 'Can I upload WebP to WordPress?',
        a: 'Yes — WordPress has accepted WebP uploads since version 5.8, and most modern CMSs and site builders take it too. If a particular platform refuses, keep those few images as PNG and convert the rest.',
      },
    ],
  },

  'convert-jpg-to-webp': {
    h1: 'Convert JPG to WebP — a third off every photo',
    lead:
      'A photo gallery, a portfolio, a product catalogue — hundreds of JPGs, every one of them ' +
      'carrying about a third more weight than it needs to. Re-encoding JPG as WebP keeps the ' +
      'visual quality and drops 25–35% of the bytes, and Scalir does it for the whole library ' +
      'at once: drag the folder in, let your own CPU do the work, download the WebP set. No ' +
      'uploads, no queue, no per-file limits.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'webp' },
    toolNote: 'Preconfigured for JPG → WebP at full size — tweak anything below.',
    sections: [
      {
        type: 'factTable',
        h2: 'What a 30% cut means at scale',
        sub: 'Typical JPG → WebP savings, multiplied by a real site.',
        columns: ['Scenario', 'Before (JPG)', 'After (WebP)'],
        rows: [
          ['One 2 MB photo', '2 MB', '~1.4 MB'],
          ['A 40-image gallery page', '~25 MB', '~17 MB'],
          ['Portfolio of 300 photos', '~450 MB served', '~310 MB served'],
          ['10,000 product views a month', '~20 GB bandwidth', '~14 GB bandwidth'],
        ],
      },
      {
        type: 'steps',
        h2: 'Batch-convert a photo library',
        steps: [
          {
            title: 'Add the JPGs',
            body: 'Files or an entire folder — the queue takes hundreds at a time.',
          },
          {
            title: 'One click, all cores',
            body: 'WebP output is preset at original dimensions and top-of-ladder quality; the batch encodes in parallel on your machine.',
          },
          {
            title: 'Ship the WebP set',
            body: 'ZIP download or save-to-folder, with your choice of file naming — prefixes, suffixes, slugs, sequential numbers.',
          },
        ],
      },
      {
        type: 'prose',
        h2: 'When to keep JPG',
        paragraphs: [
          'Not everything should convert. Email attachments, print workflows, photo-lab submissions and anywhere you cannot control the receiving software are still JPG territory. The rule of thumb: if a browser displays it, serve WebP; if a human or a machine you do not control opens it, send JPG.',
          'Scalir converts on your device either way — this page presets WebP output, and the reverse conversion is one click away when you need it.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'Related tools',
        links: [
          { path: '/convert/png-to-webp', label: 'PNG to WebP', blurb: 'Graphics and screenshots next.' },
          { path: '/compress-jpeg', label: 'Compress JPEG', blurb: 'Stay JPG, just smaller.' },
          { path: '/convert/webp-to-jpg', label: 'WebP to JPG', blurb: 'The way back, when needed.' },
          { path: '/download', label: 'Desktop app', blurb: 'Convert offline, no browser tab.' },
        ],
      },
    ],
    faq: [
      {
        q: 'How much smaller is WebP than JPEG?',
        a: 'At the same visual quality, WebP is typically 25–35% smaller than JPEG. Across a page with many images that is often the difference between a slow load and a fast one.',
      },
      {
        q: 'Should I use WebP instead of JPEG on my website?',
        a: 'For web pages, almost always yes — smaller files, faster loads and support in every modern browser. Keep JPEG for email attachments, print workflows and services that do not accept WebP.',
      },
      {
        q: 'Does converting JPG to WebP lose quality?',
        a: 'Both are lossy formats, but Scalir converts at the top of its quality ladder by default, keeping the result visually identical to the source. Use the before/after preview to inspect any image at any quality.',
      },
      {
        q: 'Can I convert WebP back to JPG later?',
        a: 'Yes — the reverse converter is one click away, and it runs the same way: locally, in bulk, for free. Keep your original JPGs as masters if you want a lossless-history archive.',
        href: '/convert/webp-to-jpg',
        linkText: 'Convert WebP to JPG',
      },
    ],
  },

  // ── Compress ────────────────────────────────────────────────────────────────────────────
  'compress-jpeg': {
    h1: 'Compress JPEG to an exact file size — without visible loss',
    lead:
      'Every other JPEG compressor hands you a quality slider and wishes you luck. Scalir asks ' +
      'a more useful question — how big is the file allowed to be? — and then binary-searches ' +
      'the encoder for the highest quality that fits: 1 MB, 500KB, whatever you set. The search ' +
      'runs on your own machine across all CPU cores, so a few hundred photos land under budget ' +
      'in the time a cloud tool spends uploading the first one.',
    toolPreset: { outputFormat: 'jpeg' },
    toolNote: 'Preconfigured for JPEG output — set your own size target below.',
    sections: [
      {
        type: 'factTable',
        h2: 'JPEG quality numbers, decoded',
        sub: 'What the 1–100 scale actually looks like in practice.',
        columns: ['Quality', 'What you get'],
        rows: [
          ['95', 'Archival — indistinguishable from the source, biggest files'],
          ['85', 'The sweet spot — visually clean at a fraction of the size'],
          ['75', 'Standard web quality — fine for photos in a page layout'],
          ['60', "Scalir's default floor — compact, still respectable"],
          ['Below 60', 'Blocking and smearing start to show; used only if you allow it'],
        ],
      },
      {
        type: 'prose',
        h2: 'Two levers, and which one to pull',
        paragraphs: [
          'File size responds to two things: pixel dimensions and encoder quality — and dimensions are by far the stronger lever. Halving the width quarters the pixel count before quality even enters the picture, which is why Scalir pairs your size target with a 2000px longest-side cap by default.',
          'The quality search then does the fine-tuning: encode, measure, adjust, landing the best quality that fits your budget. If a file cannot fit above your quality floor, it is flagged instead of ruined — you decide whether to lower the cap and rerun.',
        ],
      },
      {
        type: 'steps',
        h2: 'Compress JPEGs to a target size',
        steps: [
          {
            title: 'Queue up the photos',
            body: 'Drag in files or a folder; hundreds at a time is normal use.',
          },
          {
            title: 'Name your budget',
            body: 'Keep the 1 MB default or type an exact figure. The quality floor guards against over-compression.',
          },
          {
            title: 'Verify and download',
            body: 'Open any result in the before/after compare view, then grab the batch as a ZIP or save to a folder.',
          },
        ],
      },
      {
        type: 'crossLinks',
        h2: 'Related tools',
        links: [
          { path: '/compress-image-to-100kb', label: 'Compress to 100KB', blurb: 'The strict-limit version of this page.' },
          { path: '/convert/jpg-to-webp', label: 'JPG to WebP', blurb: 'Smaller still, for web use.' },
          { path: '/convert/heic-to-jpg', label: 'HEIC to JPG', blurb: 'iPhone photos in, JPGs out.' },
          { path: '/', label: 'Bulk image compressor', blurb: 'The full tool with presets.' },
        ],
      },
    ],
    faq: [
      {
        q: 'How do I compress a JPEG without losing quality?',
        a: 'Visually lossless compression means staying above the quality where artefacts appear. Scalir searches for the highest quality that fits your size target and never goes below your quality floor, so results stay clean — and the before/after preview lets you verify any file.',
      },
      {
        q: 'How does Scalir hit an exact JPEG file size?',
        a: 'It runs a binary search over encoder quality: encode, measure, adjust — landing the best quality that still fits under your target, rather than guessing with a fixed slider.',
      },
      {
        q: 'Can I compress many JPEGs at once?',
        a: 'Yes — that is the point. Drop in hundreds of photos or a whole folder and they are compressed in parallel across your CPU cores, then downloaded as a ZIP or saved to a folder.',
      },
      {
        q: 'Is it safe to compress JPEGs online?',
        a: 'With Scalir, yes — "online" only means it runs in your browser. Photos are compressed on your own device and never uploaded, and EXIF metadata including GPS location is stripped from the output.',
      },
    ],
  },

  'compress-png': {
    h1: 'Compress PNG — smaller files, identical pixels',
    lead:
      'The heaviest files on most computers are screenshots — full-resolution PNGs that nobody ' +
      'ever resized. Because PNG is lossless, squeezing it takes strategy rather than a quality ' +
      'slider: re-encode cleanly, cut the dimensions down to what is actually displayed, or ' +
      'switch web-bound copies to WebP with transparency intact. Scalir runs all three plays in ' +
      'one pass, in your browser, on as many files as you can drop.',
    toolPreset: { outputFormat: 'png' },
    toolNote: 'Preconfigured for PNG output — switch to Auto or WebP below for bigger savings.',
    sections: [
      {
        type: 'factTable',
        h2: 'Three ways to a smaller PNG',
        columns: ['Approach', 'What it does', 'Typical saving'],
        rows: [
          ['Re-encode as PNG', 'Lossless — every pixel identical', 'Modest'],
          ['Resize the dimensions', 'Fewer pixels, still lossless per pixel', 'Often the biggest win'],
          ['Convert to WebP', 'Visually identical, transparency kept', '60–90% smaller'],
        ],
      },
      {
        type: 'prose',
        h2: 'Screenshots: the classic oversized PNG',
        paragraphs: [
          'A screenshot from a modern laptop is a 2800px-wide PNG weighing several megabytes — destined for a doc, a ticket or a chat where it displays at a quarter of that width. Nothing about the pixels needs to change qualitatively; there are simply four times too many of them.',
          "Scalir's default 2000px cap fixes the worst of it automatically, losslessly per pixel. Set the cap to the width you actually display — say 1200px — and screenshot weight drops by 80% before any format decision is made.",
        ],
      },
      {
        type: 'steps',
        h2: 'Shrink a batch of PNGs',
        steps: [
          {
            title: 'Drop them in',
            body: 'Screenshots, exported graphics, transparent logos — the queue takes a folder at a time.',
          },
          {
            title: 'Pick your strategy',
            body: 'Stay PNG for pixel-perfect output, or flip the format to Auto/WebP and let transparency-safe conversion do the heavy lifting.',
          },
          {
            title: 'Collect the results',
            body: 'Per-file downloads, one ZIP, or straight into a folder — with before/after sizes shown for every file.',
          },
        ],
      },
      {
        type: 'crossLinks',
        h2: 'Related tools',
        links: [
          { path: '/convert/png-to-webp', label: 'PNG to WebP', blurb: 'The 60–90% option, spelled out.' },
          { path: '/compress-image-to-100kb', label: 'Compress to 100KB', blurb: 'Hard limits, any format.' },
          { path: '/convert/webp-to-png', label: 'WebP to PNG', blurb: 'Back to lossless when editing.' },
          { path: '/features', label: 'All features', blurb: 'Naming, presets, previews and more.' },
        ],
      },
    ],
    faq: [
      {
        q: 'Why is PNG compression lossless?',
        a: 'The PNG format guarantees every pixel is preserved exactly, so a PNG can only be squeezed so far. For big reductions you either shrink the dimensions or switch to a modern format like WebP.',
      },
      {
        q: 'How do I make a PNG smaller without losing transparency?',
        a: 'Either keep PNG output and reduce the dimensions, or convert to WebP — it supports the same full alpha transparency at a fraction of the size. Scalir does both, in bulk, on your device.',
      },
      {
        q: 'Should I convert PNG to WebP instead of compressing it?',
        a: 'If the image is headed for a website, usually yes: WebP is typically 60–90% smaller with transparency kept. Keep PNG when a tool demands it or you need a lossless master.',
        href: '/convert/png-to-webp',
        linkText: 'Convert PNG to WebP',
      },
      {
        q: 'Why are my screenshots such big files?',
        a: 'High-DPI displays capture at 2× or 3× resolution, so a "small" screenshot is often 2800px wide or more — far larger than it will ever be displayed. Capping the dimensions is the fix, and it is lossless in every way that matters.',
      },
    ],
  },

  'compress-image-to-100kb': {
    h1: 'Compress an image to 100KB — or any exact limit',
    lead:
      'Job portals, visa applications, forum avatars, email signatures: the internet is full of ' +
      'forms that reject anything over 100KB, and photos straight off a phone weigh thirty ' +
      'times that. Scalir closes the gap in one step — the target is preset to 100KB with a ' +
      'sensible dimension cap, and the compressor finds the best-looking result that fits. ' +
      'Change one number and the same page does 50KB, 200KB or any limit a form throws at you.',
    toolPreset: { maxMB: 0.1, maxDim: 1280, qualityFloor: 50 },
    toolNote: 'Preconfigured for a 100KB target — change it to 50KB, 200KB or anything else.',
    sections: [
      {
        type: 'factTable',
        h2: 'Common upload limits in the wild',
        columns: ['Where', 'Typical limit'],
        rows: [
          ['Job portals and application forms', '100–200KB'],
          ['Government and visa applications', '50–300KB'],
          ['Forum and community avatars', '50–100KB'],
          ['Email signatures', 'Under 100KB'],
          ['Marketplace and CMS listings', '500KB–1MB'],
        ],
      },
      {
        type: 'steps',
        h2: 'Get under 100KB in three steps',
        steps: [
          {
            title: 'Drop in the image',
            body: 'Any format the form gave you trouble with — JPG, PNG, WebP, even HEIC straight off an iPhone.',
          },
          {
            title: 'Confirm the limit',
            body: '0.1 MB and a 1280px cap are preset. A 50KB avatar field? Type 0.05 and go.',
          },
          {
            title: 'Optimise and upload',
            body: 'The result lands under the limit at the best quality that fits — check it in the preview, download, submit.',
          },
        ],
      },
      {
        type: 'prose',
        h2: 'The maths of fitting under 100KB',
        paragraphs: [
          'Dimensions decide whether 100KB is comfortable or impossible. A 4000px phone photo cannot get there gracefully — but at 1280px the same photo fits with quality to spare, which is why this page pairs the size target with a dimension cap instead of just crushing quality.',
          'Two practical notes: if the form demands a .jpg extension specifically, force JPEG in the output format setting; and if an image genuinely cannot reach the target above the quality floor, Scalir flags it rather than destroying it — drop the cap to 1000px and rerun.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'Related tools',
        links: [
          { path: '/convert/heic-to-jpg', label: 'HEIC to JPG', blurb: 'When the form also hates HEIC.' },
          { path: '/compress-jpeg', label: 'Compress JPEG', blurb: 'Roomier budgets, same search.' },
          { path: '/compress-png', label: 'Compress PNG', blurb: 'Graphics and screenshots.' },
          { path: '/', label: 'Bulk image compressor', blurb: 'The full tool with presets.' },
        ],
      },
    ],
    faq: [
      {
        q: 'How do I compress an image to exactly 100KB?',
        a: 'Set the max size to 0.1 MB — it is already preset on this page — and hit Optimise: Scalir resizes to a sensible dimension cap, then searches encoder quality for the largest result that still fits under 100KB.',
      },
      {
        q: 'Will a 100KB image still look good?',
        a: 'At sensible dimensions, yes — a 1280px photo fits comfortably under 100KB at good quality. The tighter the limit, the smaller the dimensions should be, and the before/after preview shows exactly what you will get.',
      },
      {
        q: "What if my image can't reach 100KB?",
        a: 'If the target is not reachable above your quality floor, Scalir stops at the floor and flags the file instead of ruining it. Lower the dimension cap or the quality floor and run it again.',
      },
      {
        q: 'Can I compress images to 50KB or 200KB instead?',
        a: 'Yes — the target is just a number. Set 0.05 MB for 50KB or 0.2 MB for 200KB; everything else works exactly the same, including batches.',
      },
      {
        q: 'Does compressing to 100KB remove EXIF data?',
        a: 'Yes — re-encoding strips EXIF metadata, including GPS location, from the output. For photos going to portals and forms, that is usually a privacy bonus.',
      },
    ],
  },
};
