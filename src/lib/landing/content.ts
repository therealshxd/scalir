// Content for the data-driven SEO landing pages, keyed by route id (see ../routes.data.js).
// Each entry feeds ToolLanding.svelte: the page copy, the sections, the FAQ (which also becomes
// the FAQPage JSON-LD via seo.ts, so on-page text and schema can never drift) and the tool
// preset the embedded <Tool> starts with. Adding a landing page = one routes.data.js entry +
// one entry here. test/routes.test.ts enforces the integrity rules (unique titles/h1s/FAQ
// questions, lead length, valid preset keys, cross-link targets exist, …).
//
// Copy rules: leads are keyword-led and ≥ ~60 words; every claim must be true of the real tool
// (no cropping, no upscaling, GIF is first-frame only); UK spelling ("optimise") except inside
// established format names.
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
    h1: 'Convert HEIC to JPG — free, private and in your browser',
    lead:
      'iPhones save photos as HEIC — great for storage, awkward everywhere else. Scalir converts ' +
      'HEIC to JPG entirely on your device: drop in one photo or a whole camera roll and get ' +
      'universally compatible JPGs back in seconds. There is nothing to install and nothing is ' +
      'uploaded — your photos never leave your computer, which makes it safe for private ' +
      'pictures too.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'jpeg' },
    toolNote: 'Preconfigured for HEIC → JPG at full size — tweak anything below.',
    sections: [
      {
        type: 'steps',
        h2: 'How to convert HEIC to JPG',
        steps: [
          {
            title: 'Drop in your HEIC files',
            body: 'Drag photos straight from Finder or Explorer, or pick a whole folder. Scalir reads HEIC and HEIF, including iPhone photos, bursts and screenshots.',
          },
          {
            title: 'Hit Optimise',
            body: 'The output format is already set to JPEG at full resolution. Every photo is decoded and re-encoded locally, in parallel across your CPU cores.',
          },
          {
            title: 'Download your JPGs',
            body: 'Save files individually, grab everything as a single ZIP, or write straight into a folder of your choice.',
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
        h2: 'Why convert HEIC to JPG?',
        paragraphs: [
          'HEIC packs the same photo into roughly half the space of JPEG, which is why Apple uses it — but step outside the Apple ecosystem and it gets awkward fast. Windows often needs paid codecs to open it, older editors refuse it outright, and countless upload forms simply reject anything that is not a JPG or PNG.',
          'Most online converters solve this by uploading your photos to their server. Scalir does not: the HEIC decoder runs in your browser as WebAssembly, so private photos stay private. It also strips EXIF metadata — including GPS location — from the converted files.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'More free image tools',
        links: [
          { path: '/compress-jpeg', label: 'Compress JPEG', blurb: 'Shrink the converted files to a target size.' },
          { path: '/convert/webp-to-jpg', label: 'Convert WebP to JPG', blurb: 'The same trick for images saved from the web.' },
          { path: '/features', label: 'Everything Scalir does', blurb: 'Bulk compression, resizing, formats and more.' },
          { path: '/download', label: 'Desktop app', blurb: 'The same converter, offline on Windows and Linux.' },
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
    h1: 'Convert WebP to JPG — free, private and in your browser',
    lead:
      'WebP is everywhere on the web, but plenty of apps, editors and upload forms still refuse ' +
      'it. Scalir converts WebP to JPG on your own device: drag in the files you saved from the ' +
      'web and get standard JPGs that open anywhere. It is free, needs no sign-up, and never ' +
      'uploads your images — every conversion happens entirely in your browser.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'jpeg' },
    toolNote: 'Preconfigured for WebP → JPG at full size — tweak anything below.',
    sections: [
      {
        type: 'steps',
        h2: 'How to convert WebP to JPG',
        steps: [
          {
            title: 'Add your WebP files',
            body: 'Drop in images saved from the web — one file, a selection, or a whole folder at once.',
          },
          {
            title: 'Hit Optimise',
            body: 'Output is preset to JPEG at full resolution and quality 95, so the result is simply the same image as a JPG.',
          },
          {
            title: 'Download and use anywhere',
            body: 'Single files, a ZIP of the whole batch, or straight into a folder — the JPGs open in every app and upload form.',
          },
        ],
      },
      {
        type: 'factTable',
        h2: 'WebP vs JPG at a glance',
        columns: ['', 'WebP', 'JPG'],
        rows: [
          ['File size', 'Typically 25–35% smaller', 'Larger at the same quality'],
          ['Opens in', 'Browsers and modern apps', 'Everything, everywhere'],
          ['Transparency', 'Supported', 'Not supported (flattened)'],
          ['Best for', 'Serving images on websites', 'Editing, sharing and uploading'],
        ],
      },
      {
        type: 'prose',
        h2: 'When you need JPG instead of WebP',
        paragraphs: [
          'Images saved from websites increasingly arrive as WebP — and then an older version of Photoshop, a photo frame, a printing service or a CMS upload form refuses the file. Converting to JPG gets you back to the one format every tool on earth accepts.',
          'Scalir does the conversion locally: the WebP is decoded and re-encoded as JPEG on your device, never uploaded to a server. Note that JPG has no transparency — if your WebP has transparent areas and you need to keep them, convert to PNG instead.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'More free image tools',
        links: [
          { path: '/convert/webp-to-png', label: 'Convert WebP to PNG', blurb: 'Lossless, with transparency kept.' },
          { path: '/compress-jpeg', label: 'Compress JPEG', blurb: 'Fit the converted files under a size limit.' },
          { path: '/convert/jpg-to-webp', label: 'Convert JPG to WebP', blurb: 'Going the other way for your own site.' },
          { path: '/features', label: 'Everything Scalir does', blurb: 'The full feature rundown.' },
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
    h1: 'Convert WebP to PNG — lossless, with transparency kept',
    lead:
      'Need a WebP as a PNG for an editor, a slide deck or an upload form? Scalir converts WebP ' +
      'to lossless PNG right in your browser, preserving transparency exactly. It is free and ' +
      'private — files are decoded and re-encoded on your own device, never uploaded — and it ' +
      'handles a single sticker or a whole folder of assets equally happily.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'png' },
    toolNote: 'Preconfigured for WebP → PNG at full size — tweak anything below.',
    sections: [
      {
        type: 'steps',
        h2: 'How to convert WebP to PNG',
        steps: [
          {
            title: 'Drop in your WebP files',
            body: 'Single images or a whole folder — transparent logos, stickers and UI assets all welcome.',
          },
          {
            title: 'Hit Optimise',
            body: 'Output is preset to PNG at full resolution. PNG is lossless, so every pixel — including the alpha channel — is preserved exactly.',
          },
          {
            title: 'Download your PNGs',
            body: 'Individually, as a ZIP, or saved straight to a folder, ready for any editor or form.',
          },
        ],
      },
      {
        type: 'factTable',
        h2: 'WebP vs PNG at a glance',
        columns: ['', 'WebP', 'PNG'],
        rows: [
          ['Compression', 'Lossy or lossless', 'Always lossless'],
          ['Transparency', 'Full alpha supported', 'Full alpha supported'],
          ['File size', 'Smaller', 'Larger — the price of universal support'],
          ['Best for', 'Serving images on websites', 'Editing, archiving, maximum compatibility'],
        ],
      },
      {
        type: 'prose',
        h2: 'When PNG is the right choice',
        paragraphs: [
          'PNG is the safest lossless format there is: image editors, office documents, app-store listings and upload forms that reject WebP all take PNG without complaint. Converting WebP to PNG hands you a pixel-perfect copy with transparency intact.',
          'Expect the PNG to be larger than the WebP you started with — that is normal, because PNG stores every pixel losslessly. If the result is headed back to the web and size matters, compress it or keep it as WebP in the first place.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'More free image tools',
        links: [
          { path: '/compress-png', label: 'Compress PNG', blurb: 'Rein the converted files back in.' },
          { path: '/convert/webp-to-jpg', label: 'Convert WebP to JPG', blurb: 'When transparency does not matter.' },
          { path: '/convert/png-to-webp', label: 'Convert PNG to WebP', blurb: 'Going the other way for a faster site.' },
          { path: '/features', label: 'Everything Scalir does', blurb: 'The full feature rundown.' },
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
        a: 'Whenever a tool refuses WebP: image editors, document templates, app-store listings and many upload forms. PNG is the safest lossless format for compatibility.',
      },
    ],
  },

  'convert-png-to-webp': {
    h1: 'Convert PNG to WebP — shrink images for a faster site',
    lead:
      'PNG is wonderful for fidelity and terrible for page weight. Converting PNG to WebP ' +
      'typically cuts file size by 60–90% while keeping transparency, which is why every ' +
      'pagespeed audit recommends it. Scalir batch-converts your PNGs to WebP entirely in your ' +
      'browser — free, private and with no uploads — so you can optimise a whole asset folder ' +
      'in one pass.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'webp' },
    toolNote: 'Preconfigured for PNG → WebP at full size — tweak anything below.',
    sections: [
      {
        type: 'steps',
        h2: 'How to convert PNG to WebP',
        steps: [
          {
            title: 'Add your PNG files',
            body: 'Screenshots, UI assets, logos with transparency — drop in files or a whole folder.',
          },
          {
            title: 'Hit Optimise',
            body: 'Output is preset to WebP at the original dimensions. The alpha channel is preserved automatically.',
          },
          {
            title: 'Deploy the WebP files',
            body: 'Download a ZIP or save to a folder, then swap them into your site for an instant pagespeed win.',
          },
        ],
      },
      {
        type: 'factTable',
        h2: 'PNG vs WebP at a glance',
        columns: ['', 'PNG', 'WebP'],
        rows: [
          ['Compression', 'Always lossless', 'Lossy or lossless — you choose'],
          ['Transparency', 'Full alpha supported', 'Full alpha supported'],
          ['File size', 'Large', 'Typically 60–90% smaller'],
          ['Browser support', 'Universal', 'All modern browsers (since 2020)'],
        ],
      },
      {
        type: 'prose',
        h2: 'Faster pages with WebP',
        paragraphs: [
          'Oversized PNGs are one of the most common findings in Lighthouse and PageSpeed audits — "serve images in next-gen formats" almost always means exactly this conversion. WebP keeps the transparency your UI assets need at a fraction of the bytes, which shows up directly in load time and Largest Contentful Paint.',
          'Keep a lossless PNG master for editing if you like, and serve WebP on the site. Scalir converts in bulk on your own machine, so a full asset folder is one drag-and-drop away.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'More free image tools',
        links: [
          { path: '/convert/jpg-to-webp', label: 'Convert JPG to WebP', blurb: 'The same win for your photos.' },
          { path: '/compress-png', label: 'Compress PNG', blurb: 'When you have to stay PNG.' },
          { path: '/convert/webp-to-png', label: 'Convert WebP to PNG', blurb: 'Back the other way when a tool demands it.' },
          { path: '/features', label: 'Everything Scalir does', blurb: 'The full feature rundown.' },
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
    ],
  },

  'convert-jpg-to-webp': {
    h1: 'Convert JPG to WebP — same quality, smaller files',
    lead:
      'WebP encodes the same photo noticeably smaller than JPEG at the same visual quality — ' +
      'typically 25–35% — and that saving multiplies across a whole site or gallery. Scalir ' +
      'converts JPG to WebP in bulk, right in your browser: no uploads, no accounts, no software ' +
      'to install. Drop in your photos, keep the original dimensions, and download web-ready ' +
      'WebP files in one go.',
    toolPreset: { ...CONVERT_PRESET, outputFormat: 'webp' },
    toolNote: 'Preconfigured for JPG → WebP at full size — tweak anything below.',
    sections: [
      {
        type: 'steps',
        h2: 'How to convert JPG to WebP',
        steps: [
          {
            title: 'Add your JPG photos',
            body: 'A hero image, a product gallery or a whole photo library — files or folders both work.',
          },
          {
            title: 'Hit Optimise',
            body: 'Output is preset to WebP at the original dimensions and top-of-ladder quality — visually identical, meaningfully smaller.',
          },
          {
            title: 'Serve the WebP files',
            body: 'Download as a ZIP or save to a folder and swap them into your pages.',
          },
        ],
      },
      {
        type: 'factTable',
        h2: 'JPG vs WebP at a glance',
        columns: ['', 'JPG', 'WebP'],
        rows: [
          ['File size', 'Baseline', 'Typically 25–35% smaller'],
          ['Quality', 'Good', 'Equal at the smaller size'],
          ['Opens in', 'Everything, everywhere', 'Browsers and modern apps'],
          ['Best for', 'Email, print, maximum compatibility', 'Serving images on websites'],
        ],
      },
      {
        type: 'prose',
        h2: 'Why serve WebP instead of JPEG?',
        paragraphs: [
          'Image bytes dominate most page weights, and Largest Contentful Paint is usually an image. Cutting every photo by a quarter to a third — at identical visual quality — is the cheapest pagespeed win there is, and it is exactly what the "serve images in next-gen formats" audit is asking for.',
          'Keep JPGs for email attachments, print workflows and anywhere that will not take WebP. For everything web-facing, convert once with Scalir — locally, in bulk, with nothing uploaded — and enjoy the faster loads.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'More free image tools',
        links: [
          { path: '/convert/png-to-webp', label: 'Convert PNG to WebP', blurb: 'The same win for graphics and screenshots.' },
          { path: '/compress-jpeg', label: 'Compress JPEG', blurb: 'When you need to stay JPEG.' },
          { path: '/convert/webp-to-jpg', label: 'Convert WebP to JPG', blurb: 'Back the other way for compatibility.' },
          { path: '/features', label: 'Everything Scalir does', blurb: 'The full feature rundown.' },
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
    ],
  },

  // ── Compress ────────────────────────────────────────────────────────────────────────────
  'compress-jpeg': {
    h1: 'Compress JPEG images — hit an exact size without visible loss',
    lead:
      'Scalir compresses JPEGs the smart way: instead of guessing with a fixed quality slider, ' +
      'it searches the encoder for the highest quality that still fits under your size target — ' +
      '1 MB by default. Everything runs in your browser across all CPU cores, so a whole folder ' +
      'of photos compresses in seconds, privately, with nothing uploaded and no sign-up.',
    toolPreset: { outputFormat: 'jpeg' },
    toolNote: 'Preconfigured for JPEG output — set your own size target below.',
    sections: [
      {
        type: 'steps',
        h2: 'How to compress a JPEG',
        steps: [
          {
            title: 'Drop in your JPEGs',
            body: 'One photo or a few hundred — drag them in or pick a folder.',
          },
          {
            title: 'Set your size target',
            body: 'Keep the 1 MB default or type an exact budget. Scalir finds the best quality that fits under it, never dropping below your quality floor.',
          },
          {
            title: 'Optimise and download',
            body: 'Compare any file before/after if you want proof, then download singles, a ZIP, or save to a folder.',
          },
        ],
      },
      {
        type: 'factTable',
        h2: 'What actually makes a JPEG heavy',
        columns: ['Factor', 'Impact'],
        rows: [
          ['Pixel dimensions', 'The biggest one — halving the width quarters the pixels. Scalir caps the longest side at 2000px by default.'],
          ['Quality setting', 'Big, but non-linear: 95 → 80 saves a lot and looks the same; below ~60 artefacts creep in.'],
          ['Fine detail and noise', 'Grainy, busy photos compress worse than clean ones at the same settings.'],
          ['Metadata', 'EXIF (camera info, GPS location) adds weight — Scalir strips it automatically.'],
        ],
      },
      {
        type: 'prose',
        h2: 'How the target-size search works',
        paragraphs: [
          'Most compressors make you pick a quality number and hope. Scalir inverts that: you say what the file must weigh, and it runs a binary search over encoder quality — encode, measure, adjust — until it lands the best-looking JPEG that fits your budget.',
          'A quality floor protects your photos: if a file cannot reach the target without dropping below the floor, Scalir stops there and flags it rather than ruining the image. The before/after preview lets you inspect any file at any quality before you commit.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'More free image tools',
        links: [
          { path: '/compress-image-to-100kb', label: 'Compress to 100KB', blurb: 'For forms with hard upload limits.' },
          { path: '/convert/jpg-to-webp', label: 'Convert JPG to WebP', blurb: 'Even smaller files for the web.' },
          { path: '/compress-png', label: 'Compress PNG', blurb: 'The lossless cousin.' },
          { path: '/features', label: 'Everything Scalir does', blurb: 'The full feature rundown.' },
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
    h1: 'Compress PNG images — lossless first, WebP when you want more',
    lead:
      'PNG is a lossless format, so compressing it is a different game to JPEG: Scalir ' +
      're-encodes your PNGs cleanly, resizes oversized ones to fit your dimension cap, and — ' +
      'when you allow it — converts to WebP for far bigger savings with transparency intact. ' +
      'All of it happens in your browser: free, private, no uploads, and a whole folder at a ' +
      'time.',
    toolPreset: { outputFormat: 'png' },
    toolNote: 'Preconfigured for PNG output — switch to Auto or WebP below for bigger savings.',
    sections: [
      {
        type: 'steps',
        h2: 'How to compress a PNG',
        steps: [
          {
            title: 'Add your PNG files',
            body: 'Screenshots, graphics, transparent logos — files or a whole folder.',
          },
          {
            title: 'Choose your trade-off',
            body: 'Keep PNG output for pixel-perfect lossless results, or allow WebP conversion for much smaller files with transparency kept.',
          },
          {
            title: 'Optimise and download',
            body: 'Grab everything as a ZIP or save straight to a folder.',
          },
        ],
      },
      {
        type: 'factTable',
        h2: 'Your options for a smaller PNG',
        columns: ['Approach', 'What it does', 'Typical saving'],
        rows: [
          ['Re-encode as PNG', 'Lossless — every pixel identical', 'Modest'],
          ['Resize the dimensions', 'Fewer pixels, still lossless per pixel', 'Often the biggest win'],
          ['Convert to WebP', 'Visually identical, transparency kept', '60–90% smaller'],
        ],
      },
      {
        type: 'prose',
        h2: 'Why PNGs stay big — and what to do about it',
        paragraphs: [
          'PNG guarantees every pixel survives exactly, which puts a hard floor under how small the file can get. That is perfect for masters and assets you will edit again, but wasteful for anything a browser will display.',
          'The pragmatic recipe: resize screenshots and photos down to the dimensions you actually display, and let web-bound images convert to WebP — same transparency, a fraction of the bytes. Scalir does both in one pass, locally.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'More free image tools',
        links: [
          { path: '/convert/png-to-webp', label: 'Convert PNG to WebP', blurb: 'The biggest saving for web assets.' },
          { path: '/compress-jpeg', label: 'Compress JPEG', blurb: 'Target-size compression for photos.' },
          { path: '/compress-image-to-100kb', label: 'Compress to 100KB', blurb: 'For hard upload limits.' },
          { path: '/features', label: 'Everything Scalir does', blurb: 'The full feature rundown.' },
        ],
      },
    ],
    faq: [
      {
        q: 'Why is PNG compression lossless?',
        a: "The PNG format guarantees every pixel is preserved exactly, so a PNG can only be squeezed so far. For big reductions you either shrink the dimensions or switch to a modern format like WebP.",
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
    ],
  },

  'compress-image-to-100kb': {
    h1: 'Compress an image to 100KB — or any exact limit',
    lead:
      'Upload forms love hard limits: 100KB avatars, 200KB documents, 50KB thumbnails. Scalir ' +
      'compresses any image to the exact size you need — set the target and it finds the ' +
      'best-looking combination of dimensions and quality that fits under it. It is free, runs ' +
      'entirely in your browser with no uploads, and handles a batch just as easily as a single ' +
      'file.',
    toolPreset: { maxMB: 0.1, maxDim: 1280, qualityFloor: 50 },
    toolNote: 'Preconfigured for a 100KB target — change it to 50KB, 200KB or anything else.',
    sections: [
      {
        type: 'steps',
        h2: 'How to compress an image to 100KB',
        steps: [
          {
            title: 'Drop in your image',
            body: 'Any format — JPG, PNG, WebP, even HEIC straight off an iPhone. Batches welcome.',
          },
          {
            title: 'Check the target',
            body: 'The max size is already set to 0.1 MB (100KB) with a sensible dimension cap. Need 50KB or 200KB? Just change the number.',
          },
          {
            title: 'Optimise and download',
            body: 'Every file lands under the limit at the best quality that fits — preview before/after if you want to see it.',
          },
        ],
      },
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
        type: 'prose',
        h2: 'How to fit under 100KB and still look good',
        paragraphs: [
          'Dimensions matter more than quality: a 4000px photo cannot reach 100KB gracefully, but at 1280px it fits with quality to spare — which is why this page presets a 1280px cap alongside the 0.1 MB target. Scalir then searches encoder quality for the best result that fits.',
          'If a form insists on .jpg specifically, force JPEG in the output format setting. And if a file genuinely cannot reach the target above the quality floor, Scalir flags it instead of destroying it — lower the dimension cap and run again.',
        ],
      },
      {
        type: 'crossLinks',
        h2: 'More free image tools',
        links: [
          { path: '/compress-jpeg', label: 'Compress JPEG', blurb: 'Target-size compression for photos.' },
          { path: '/compress-png', label: 'Compress PNG', blurb: 'Lossless compression for graphics.' },
          { path: '/convert/heic-to-jpg', label: 'Convert HEIC to JPG', blurb: 'iPhone photos, form-ready.' },
          { path: '/features', label: 'Everything Scalir does', blurb: 'The full feature rundown.' },
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
    ],
  },
};
