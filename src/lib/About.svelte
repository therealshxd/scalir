<script lang="ts">
  const EMAIL = 'hello@shad.digital';
  const REPO = 'https://github.com/therealshxd/scalir';
  const DONATE = 'https://www.paypal.com/ncp/payment/5ZZUTJ98X9E78';
</script>

<div class="wrap doc">
  <section class="section" style="border-top:0">
    <h1>About Scalir</h1>
    <p class="lead">
      The story behind the tool, how to support it, and the (very short) rules.
    </p>

    <!-- Why -->
    <div class="card">
      <h3>Why did you build this?</h3>
      <p class="muted-sub">I'm tired of paying for tools, so I thought I'd build my own.</p>
      <p>
        I got tired of looking for tools that should be free asking me for account signups or payment
        to continue, so I built my own. I built this tool for myself and use it every day across client
        work. I use it to optimise images before uploading to WordPress sites, which reduces server
        overheads from plugins like Smush and the cost of services like Smush.
      </p>
      <p>
        This works locally, on your own computer. No files are stored or kept on my side — they are just
        processed by the tool. Once done, you get a zip file with your scaled images. The tool also gives
        you a good estimate of total space saved per run.
      </p>
    </div>

    <!-- Donate -->
    <div class="card">
      <h3>Donate if you love it!</h3>
      <p class="muted-sub">I built this for free, and expect nothing in return.</p>
      <p>
        However, as you know, things cost money to host. I'd like to maintain this project and expand on
        it over time based on user feedback — ideally creating a suite of applications for simple tasks
        that should be free, not restricted to accounts and fees. I believe in the
        <strong>free and open-source web</strong>. If you do too, help a brother out with hosting costs.
      </p>
      <div class="sec-cta"><a class="cta" href={DONATE} target="_blank" rel="noreferrer">Donate via PayPal</a></div>
    </div>

    <!-- Bugs -->
    <div class="card">
      <h3>Report bugs and issues</h3>
      <p class="muted-sub">Tell me if there's something wrong!</p>
      <p>
        This tool was built with the help of Claude AI. It is not an AI tool, nor does it need to be.
        It's a simple processor for images — does what it says on the tin: compression for the web.
        If you find any bugs, please report them on the
        <a href={REPO} target="_blank" rel="noreferrer">GitHub repo</a> or drop me a message at
        <a href={'mailto:' + EMAIL}>{EMAIL}</a> and I'll review what's going wrong!
      </p>
    </div>

    <!-- Terms -->
    <div class="card">
      <h3>Terms &amp; Conditions</h3>
      <p class="muted-sub">Simple. Just use the tool, and maybe mention me on Reddit.</p>
      <p>
        I'm not asking for much here. Use the tool; if it's helpful, share it with friends and family,
        or post it on your social media or Reddit. I don't want to be paid for this — I just want people
        to stop thinking everything needs to be about money. It's under the
        <a href={REPO + '/blob/main/LICENSE'} target="_blank" rel="noreferrer">MIT license</a>, so whatever
        that says, just obey those rules and we're all good, homie.
      </p>
    </div>

    <div class="sec-cta" style="margin-top:22px">
      <a class="cta" href="#/">Try Scalir</a>
      <a class="cta ghost" href="#/features">See features</a>
    </div>
    <p class="lead" style="margin-top:18px"><a href="#/">← Back to the tool</a></p>
  </section>
</div>

<style>
  .card p { color: var(--muted); margin: 0 0 12px; line-height: 1.6; }
  .card p:last-of-type { margin-bottom: 0; }
  .card p strong { color: var(--text); }
  .muted-sub { color: var(--accent) !important; font-weight: 600; margin-bottom: 10px !important; }
  .card p a { color: var(--accent); }
  .sec-cta { display: flex; gap: 12px; flex-wrap: wrap; }
</style>
