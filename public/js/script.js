// ============ NAV SCROLL SHADOW ============
  (function(){
    const nav = document.querySelector('.nav');
    if(!nav) return;
    const onNavScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onNavScroll, { passive:true });
    onNavScroll();
  })();

  // ============ NAV MOBILE MENU ============
  (function(){
    const nav = document.querySelector('.nav');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if(!nav || !toggle || !links) return;
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    window.addEventListener('resize', () => { if(window.innerWidth > 760) setOpen(false); });
  })();

  // ============ DECLUTTER SCROLL ANIMATION ============
  (function(){
    const section = document.getElementById('top');
    const stage = document.getElementById('declutterStage');
    const monitor = document.getElementById('monitor');
    const systemCount = document.getElementById('systemCount');
    const systemStatus = document.getElementById('systemStatus');
    const stressedImg = document.querySelector('.declutter__img--stressed');
    const happyImg = document.querySelector('.declutter__img--happy');
    const declutterGlow = document.getElementById('declutterGlow');
    const viewCollect = document.getElementById('viewCollect');
    const viewDash = document.getElementById('viewDash');
    const statLeads = document.getElementById('statLeads');
    const statConv = document.getElementById('statConv');
    const headTxts = Array.from(document.querySelectorAll('.declutter__head-txt'));
    if(!section || !stage || !monitor) return;

    const chipEls = Array.from(stage.querySelectorAll('.chip:not([data-at])'));
    const staggerStep = 0.028, duration = 0.22;
    const chips = chipEls.map((el,i)=>({
      el,
      range:[ i*staggerStep, i*staggerStep + duration ],
      dx:0, dy:0
    }));

    const revealEls = Array.from(stage.querySelectorAll('[data-at]')).map(el=>({
      el, at:parseFloat(el.dataset.at), isPanel: el.classList.contains('panel'), shown:null
    }));

    // every positioned element that has a mobile-specific spot (data-mt/data-ml)
    const posEls = Array.from(stage.querySelectorAll('[data-mt][data-ml]'));
    let posMode = null; // 'desktop' | 'mobile'

    function applyPositions(){
      const mobile = window.innerWidth <= 900;
      const mode = mobile ? 'mobile' : 'desktop';
      if(mode === posMode) return;
      posMode = mode;
      posEls.forEach(el=>{
        if(mobile){
          el.dataset.dt = el.dataset.dt || el.style.top;
          el.dataset.dl = el.dataset.dl || el.style.left;
          el.style.top = el.dataset.mt + '%';
          el.style.left = el.dataset.ml + '%';
        } else {
          if(el.dataset.dt !== undefined) el.style.top = el.dataset.dt;
          if(el.dataset.dl !== undefined) el.style.left = el.dataset.dl;
        }
      });
    }

    let lastProgress = -1;
    let lastCount = -1;

    function headOpacity(idx, progress){
      const breaks = [0.5, 0.8], band = 0.05;
      const clamp01 = v => Math.max(0, Math.min(1, v));
      if(idx === 0) return clamp01(1 - (progress-(breaks[0]-band))/(2*band));
      if(idx === 1){
        if(progress <= breaks[0]-band) return 0;
        if(progress < breaks[0]+band) return clamp01((progress-(breaks[0]-band))/(2*band));
        if(progress <= breaks[1]-band) return 1;
        if(progress < breaks[1]+band) return clamp01(1-(progress-(breaks[1]-band))/(2*band));
        return 0;
      }
      return clamp01((progress-(breaks[1]-band))/(2*band));
    }

    function measure(){
      applyPositions();
      chipEls.forEach(el=>{ el.style.transform = 'translate(0,0) scale(1)'; });
      const targetRect = monitor.querySelector('.monitor__screen').getBoundingClientRect();
      const tcx = targetRect.left + targetRect.width/2;
      const tcy = targetRect.top + targetRect.height/2;
      chips.forEach(c=>{
        const r = c.el.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        c.dx = tcx - cx;
        c.dy = tcy - cy;
      });
    }

    function ease(t){ return t<0.5 ? 2*t*t : -1+(4-2*t)*t; }

    function computeProgress(){
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      if(total <= 0) return 0;
      const scrolled = -rect.top;
      return Math.max(0, Math.min(1, scrolled/total));
    }

    function apply(progress){
      if(progress === lastProgress) return;
      lastProgress = progress;

      // phase 1: chaos chips fly into the monitor
      let arrived = 0;
      chips.forEach(c=>{
        const [start,end] = c.range;
        let t = (progress-start)/(end-start);
        t = Math.max(0, Math.min(1, t));
        const e = ease(t);
        c.el.style.transform = `translate(${c.dx*e}px, ${c.dy*e}px) scale(${1-0.7*e})`;
        c.el.style.opacity = String(1-e);
        if(t >= 0.98) arrived++;
      });
      if(arrived !== lastCount){
        lastCount = arrived;
        systemCount.textContent = String(arrived);
        systemStatus.textContent = arrived === 0 ? 'Waiting…' : arrived < chips.length ? 'Organizing…' : 'Synced ✓';
      }

      // phase 2: owl + monitor crossfade (chaos -> calm dashboard)
      const fadeStart = 0.55, fadeEnd = 0.70;
      let f = (progress-fadeStart)/(fadeEnd-fadeStart);
      f = Math.max(0, Math.min(1, f));
      stressedImg.style.opacity = String(1-f);
      happyImg.style.opacity = String(f);
      if(declutterGlow){
        // no glow at all on the first (stressed) image — only builds in as it moves toward the happy owl
        const glowRamp = Math.max(0, Math.min(1, progress / fadeEnd));
        declutterGlow.style.opacity = String(glowRamp);
      }
      viewCollect.style.opacity = String(1-f);
      viewDash.style.opacity = String(f);
      if(statLeads) statLeads.textContent = String(Math.round(128*f));
      if(statConv) statConv.textContent = String(Math.round(256*f));

      // monitor entrance: not present in the very first frame, fades/scales in shortly after scrolling starts
      const entranceStart = 0, entranceEnd = 0.1;
      let en = (progress-entranceStart)/(entranceEnd-entranceStart);
      en = Math.max(0, Math.min(1, en));
      const enEase = ease(en);
      monitor.style.opacity = String(enEase);
      const pulseScale = 1 + 0.05*ease(Math.min(1, progress/0.55));
      const entranceScale = 0.85 + 0.15*enEase;
      monitor.style.transform = `${posMode === 'mobile' ? 'translateX(-50%)' : 'translate(0,-50%)'} scale(${pulseScale * entranceScale})`;

      // phase 3: analytics panels + icons reveal around the happy owl
      revealEls.forEach(item=>{
        const show = progress >= item.at;
        if(show !== item.shown){
          item.shown = show;
          if(item.isPanel){
            item.el.classList.toggle('is-in', show);
          } else {
            item.el.style.opacity = show ? '1' : '0';
          }
        }
      });

      // header text: crossfade through the 3 story beats, tied directly to scroll progress
      headTxts.forEach((el,i)=>{ el.style.opacity = String(headOpacity(i, progress)); });
    }

    let ticking = false;
    function onScroll(){
      if(!ticking){
        requestAnimationFrame(()=>{ apply(computeProgress()); ticking = false; });
        ticking = true;
      }
    }

    let resizeT;
    function onResize(){
      clearTimeout(resizeT);
      resizeT = setTimeout(()=>{ measure(); lastProgress = -1; lastCount = -1; apply(computeProgress()); }, 150);
    }

    window.addEventListener('load', ()=>{ measure(); apply(computeProgress()); });
    requestAnimationFrame(()=>{ measure(); apply(computeProgress()); });
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onResize);
  })();

  // scroll-reveal
  const items = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold:.12 });
  items.forEach(el=>io.observe(el));

  // stats band: count up from 0 to each number once it scrolls into view
  const statNums = document.querySelectorAll('.stat__num');
  const statIO = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      statIO.unobserve(e.target);
      const el = e.target;
      const target = parseInt(el.textContent, 10);
      if(Number.isNaN(target)) return; // non-numeric stat (e.g. "∞") — nothing to count up, leave as-is
      const suffix = el.textContent.replace(/[0-9]/g,'');
      const start = performance.now();
      const duration = 1100;
      function tick(now){
        const t = Math.min(1, (now-start)/duration);
        const eased = 1 - Math.pow(1-t, 3);
        el.textContent = Math.round(target*eased) + suffix;
        if(t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold:.5 });
  statNums.forEach(el=>statIO.observe(el));

  // journey step sounds: a short rising note per step as it becomes active, so the
  // "from hello to deal" journey has a light audible cue alongside the visual highlight.
  const playJourneyNote = (function(){
    let audioCtx = null;

    function getCtx(){
      if(audioCtx) return audioCtx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      audioCtx = new AC();
      return audioCtx;
    }
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 987.77]; // C5..B5, brighter on the final "win" step

    // audio can't play until a real user gesture unlocks the context (scrolling alone doesn't count) —
    // kick the resume off as early as possible so the first real chime has less latency
    ['pointerdown','keydown','touchstart'].forEach(evt=>{
      addEventListener(evt, function(){
        const ctx = getCtx();
        if(ctx && ctx.state === 'suspended') ctx.resume();
      }, { once:true, passive:true });
    });

    function playTone(ctx, freq){
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(.09, now + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + .34);
    }
    // resume() is async — if the context isn't running yet, wait for it instead of silently
    // dropping the note, so the very first click/tap always produces sound, not just the second one
    function chime(freq){
      const ctx = getCtx();
      if(!ctx) return;
      if(ctx.state === 'suspended') ctx.resume().then(()=> playTone(ctx, freq));
      else playTone(ctx, freq);
    }

    return function(index){
      chime(notes[index] ?? notes[notes.length-1]);
    };
  })();

  // journey timeline: pinned on desktop so each of the 6 steps gets real scroll dwell time.
  // mobile scrolls normally (no pin/scroll-hijack) — cards just fade/scale up one at a time,
  // in the same order the snake connector line draws, as they naturally pass through the viewport.
  (function(){
    function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
    const timelinePinwrap = document.getElementById('timelinePinwrap');
    const timeline = document.getElementById('timeline3d');
    const tCards = Array.from(document.querySelectorAll('.tcard'));
    const tProgress = document.getElementById('timelineProgress');
    if(!timeline || !tCards.length) return;
    let lastActive = -1;
    let soundReady = false;

    // desktop lights cards up left-to-right in plain step order; mobile's grid follows the
    // zigzag "snake" connector path (see the nth-child order rules in css/styles.css), so the
    // reveal has to walk cards in that same visual order — Capture, Greet, Nurture, Qualify, Book, Win —
    // otherwise the highlight would jump around off the connector line instead of sweeping along it.
    const straightOrder = [0,1,2,3,4,5];
    const mobileSnakeOrder = [0,1,3,2,4,5];

    function updateTimeline(){
      const pinned = innerWidth > 980 && timelinePinwrap;
      let p;
      if(pinned){
        const rect = timelinePinwrap.getBoundingClientRect();
        const total = timelinePinwrap.offsetHeight - innerHeight;
        p = total > 0 ? clamp(-rect.top/total,0,1) : 0;
      } else {
        const r = timeline.getBoundingClientRect();
        p = clamp((innerHeight*.78-r.top)/(r.height*.9),0,1);
      }
      const sweepPos = Math.min(tCards.length-1, Math.floor(p*tCards.length));
      const revealOrder = pinned ? straightOrder : mobileSnakeOrder;
      const activeStep = revealOrder[sweepPos];
      if(sweepPos !== lastActive){
        if(soundReady) playJourneyNote(sweepPos);
        lastActive = sweepPos;
      }
      tCards.forEach((card,i)=>{
        const posInOrder = revealOrder.indexOf(i);
        card.classList.toggle('done', posInOrder < sweepPos);
        card.classList.toggle('active', posInOrder === sweepPos);
        if(pinned){
          const distance=i-activeStep;
          const lift = distance===0 ? 10 : (i<activeStep ? 4 : 0);
          const depth = distance===0 ? 80 : (i<activeStep ? 22 : 0);
          card.style.transform=`translateY(${-lift}px) translateZ(${depth}px) rotateY(${clamp(distance*5,-14,14)}deg)`;
        } else {
          card.style.transform='';
        }
      });
      if(tProgress) tProgress.style.width=(clamp(p*1.02,0,1)*100)+'%';
    }
    addEventListener('scroll',updateTimeline,{passive:true});
    addEventListener('resize',updateTimeline);
    updateTimeline();
    soundReady = true;

    // piano-key behaviour: tap/click (or Enter/Space when focused) any card to hear its note directly —
    // works the same on mobile taps and desktop clicks, independent of scroll position.
    tCards.forEach((card,i)=>{
      card.setAttribute('tabindex','0');
      card.setAttribute('role','button');
      card.setAttribute('aria-label', card.querySelector('h3') ? 'Play sound for step: ' + card.querySelector('h3').textContent : 'Play step sound');
      function pressCard(){
        playJourneyNote(i);
        card.classList.remove('key-press');
        void card.offsetWidth; // restart the animation on repeat presses
        card.classList.add('key-press');
      }
      card.addEventListener('click', pressCard);
      card.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
          e.preventDefault();
          pressCard();
        }
      });
    });
  })();

  // features: the same connected-hub diagram, wakes up as it scrolls into view
  (function(){
    const featuresStage = document.getElementById('featuresStage');
    if(!featuresStage) return;
    function updateFeaturesStage(){
      const r = featuresStage.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight*.78-r.top)/(r.height*.68)));
      featuresStage.classList.toggle('active', p>.12);
    }
    addEventListener('scroll',updateFeaturesStage,{passive:true});
    addEventListener('resize',updateFeaturesStage);
    updateFeaturesStage();
  })();

  // nav scroll-spy: highlight the link for whichever section is in view
  const navLinks = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
  const navTargets = navLinks
    .map(link => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
    .filter(t => t.section);

  if(navTargets.length){
    const navIO = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const match = navTargets.find(t => t.section === entry.target);
          if(match){
            navLinks.forEach(l => l.classList.toggle('is-active', l === match.link));
          }
        }
      });
    }, { rootMargin:'-45% 0px -50% 0px', threshold:0 });
    navTargets.forEach(t => navIO.observe(t.section));

    // near the very bottom of the page, force-highlight the last link (footer sections can be too short to trigger the observer band)
    window.addEventListener('scroll', ()=>{
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6;
      if(atBottom){
        const last = navTargets[navTargets.length-1];
        navLinks.forEach(l => l.classList.toggle('is-active', l === last.link));
      }
    }, { passive:true });
  }

  // ============ CONTACT MODAL ============
  (function(){
    const modal = document.getElementById('contactModal');
    if(!modal) return;
    const closeBtn = document.getElementById('closeContactModal');
    const triggers = document.querySelectorAll('.js-contact-trigger');
    const form = document.getElementById('contactForm');
    const status = document.getElementById('contactFormStatus');

    function openModal(){
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(){
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    triggers.forEach(t => t.addEventListener('click', (e)=>{
      e.preventDefault();
      openModal();
    }));
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

    if(form){
      form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const submitBtn = form.querySelector('.contact-form__submit');
        const data = {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim(),
          message: form.message.value.trim(),
        };
        status.textContent = '';
        status.className = 'contact-form__status';
        submitBtn.disabled = true;
        submitBtn.querySelector('.contact-form__submit-label').textContent = 'Sending…';
        try{
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await res.json();
          if(res.ok && result.ok){
            status.textContent = "Thanks — we'll get back to you shortly.";
            status.classList.add('is-success');
            form.reset();
          } else {
            status.textContent = result.error || 'Something went wrong. Please try again.';
            status.classList.add('is-error');
          }
        } catch(err){
          status.textContent = "Couldn't reach the server. Please try again in a moment.";
          status.classList.add('is-error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.querySelector('.contact-form__submit-label').textContent = 'Send message';
        }
      });
    }
  })();

  // ============ REFER & EARN ============
  (function(){
    const modal = document.getElementById('referralModal');
    if(!modal) return;
    const closeBtn = document.getElementById('closeReferralModal');
    const triggers = document.querySelectorAll('.js-referral-trigger');
    const form = document.getElementById('referralForm');
    const status = document.getElementById('referralFormStatus');
    const submitBtn = form.querySelector('.contact-form__submit');

    function openModal(){
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(){
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    triggers.forEach(t => t.addEventListener('click', (e)=>{
      e.preventDefault();
      openModal();
    }));
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const data = {
        referrerName: form.referrerName.value.trim(),
        referrerPhone: form.referrerPhone.value.trim(),
        tenantId: form.tenantId.value.trim(),
      };
      status.textContent = '';
      status.className = 'contact-form__status';
      submitBtn.disabled = true;
      submitBtn.querySelector('.contact-form__submit-label').textContent = 'Sending…';
      try{
        const res = await fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if(res.ok && result.ok){
          status.textContent = "Thanks — we'll follow up with your friend shortly.";
          status.classList.add('is-success');
          form.reset();
        } else {
          status.textContent = result.error || 'Something went wrong. Please try again.';
          status.classList.add('is-error');
        }
      } catch(err){
        status.textContent = "Couldn't reach the server. Please try again in a moment.";
        status.classList.add('is-error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.contact-form__submit-label').textContent = 'Send referral';
      }
    });
  })();

  // ============ CHAT WIDGET ============
  (function(){
    const widget = document.getElementById('chatWidget');
    if(!widget) return;
    const launcher = document.getElementById('chatwLauncher');
    const badge = document.getElementById('chatwBadge');
    const greet = document.getElementById('chatwGreet');
    const greetClose = document.getElementById('chatwGreetClose');
    const panel = document.getElementById('chatwPanel');
    const closeBtn = document.getElementById('chatwClose');
    const body = document.getElementById('chatwBody');
    const form = document.getElementById('chatwForm');
    const input = document.getElementById('chatwInput');

    // answers are grounded in the site's own copy (journey, features, pricing, industries)
    // so the bot never states something the rest of the page doesn't already back up
    const FAQ = [
      { id:'what', question:'What is Alead?',
        keywords:['what is alead','about alead','what does alead do','what is this','tell me about alead','overview','what is your product'],
        answer:"Alead is an AI lead management platform. Every call, WhatsApp message, form and DM lands in one system — sorted, scored and ready for your team, so nothing gets missed." },
      { id:'pricing', question:'How much does it cost?',
        keywords:['pricing','price','cost','how much','fee','plan','pricing plans','subscription','monthly cost'],
        answer:"Pricing is custom, built around your business — there's no fixed public tier. It includes unlimited leads, unlimited team members, industry customization, white-label options, a dedicated account manager and 24/7 phone support. Want a personalized quote? Tap “Talk to our team” below." },
      { id:'features', question:'What features does it have?',
        keywords:['feature','features','what can it do','capabilities','what do you offer','tools','functionality'],
        answer:"The core toolkit: AI lead scoring, smart call tracking with transcripts, WhatsApp/email/Meta marketing campaigns, automated workflows and follow-ups, team performance tracking, live analytics dashboards, automated billing, and bank-grade security." },
      { id:'journey', question:'How does it work?',
        keywords:['how does it work','journey','process','workflow','how it works','lead journey','pipeline stages','what happens to a lead'],
        answer:"Every lead moves through six automated stages: Capture → Greet → Qualify → Nurture → Book → Win. AI responds instantly, qualifies intent and budget, follows up at the right time, and books the meeting — while outcomes feed back in to improve the next lead." },
      { id:'industries', question:'Which industries is it for?',
        keywords:['industry','industries','who is it for','business type','sector','use case','real estate','education','healthcare','travel','migration'],
        answer:"Real Estate, Education, Migration, Vehicle, Travel, Healthcare, Services — and pretty much any industry with an inbound channel to manage, each set up with the right questions and follow-up timing." },
      { id:'who-for', question:'Is Alead for small businesses?',
        keywords:['small business','solo founder','small team','startup','growing team','one person team'],
        answer:"Yes — Alead is built for small and growing teams. It automates the busywork so you can manage your pipeline and focus on growing the business, without needing a big ops team." },
      { id:'security', question:'Is my data secure?',
        keywords:['secure','security','safe','encryption','data protection','compliance','privacy'],
        answer:"Yes — Alead runs on bank-grade encryption with 24/7 threat monitoring built in." },
      { id:'channels', question:'Does it support WhatsApp and email?',
        keywords:['whatsapp','channels','integration','email campaign','meta','sms','facebook','instagram','social media'],
        answer:"Yes. Leads can come in through calls, WhatsApp, forms or DMs, and the Smart Marketing tools run WhatsApp, email and Meta campaigns from one place." },
      { id:'calls', question:'Does it track phone calls?',
        keywords:['call tracking','transcribe','phone call','call recording','voicemail'],
        answer:"Smart Call Tracking transcribes every call automatically and flags what matters, so nothing said on a call gets lost." },
      { id:'analytics', question:'Can I see reports and analytics?',
        keywords:['analytics','report','dashboard','performance','track rep','reporting','insights','metrics'],
        answer:"Live Analytics gives you dashboards filtered any way you need, and Team Performance tracks rep activity and coaching opportunities." },
      { id:'billing', question:'Does it handle billing?',
        keywords:['billing','invoice','invoicing','accounting','payments'],
        answer:"Yes — Billing & Accounting automates invoicing with cash-flow forecasts built in." },
      { id:'demo', question:'Can I get a demo?',
        keywords:['demo','trial','free','try it','get started','book a demo','schedule a call','see it in action'],
        answer:"You can book a free personalized demo — share your details with “Talk to our team” below and we'll set it up." },
      { id:'onboarding', question:'How do I get set up?',
        keywords:['sign up','onboarding','how do i start','first steps','set up my account','implementation'],
        answer:"Easiest way is to book a free personalized demo — tap “Talk to our team” below, share your email, and we'll set it up and walk you through the rest." },
      { id:'results', question:'What results can I expect?',
        keywords:['roi','results','improve','increase','lead leakage','case study','success stories','proof'],
        answer:"Teams using Alead have seen up to a 300% average ROI increase and 70% performance increase, with 0% lead leakage — every enquiry captured and followed up automatically." },
      { id:'contact', question:'How can I contact you?',
        keywords:['contact','email address','phone number','reach you','support','get in touch','customer support','helpline'],
        answer:"Email alead.aesw@gmail.com, call +91 62828 07741, or WhatsApp the same number — 24/7 phone support is included on the plan." },
      { id:'team-size', question:'Is there a limit on team members?',
        keywords:['team members','team size','unlimited users','how many users','seats','licenses'],
        answer:"No limit — unlimited leads and unlimited team members, plus white-label options and a dedicated account manager." },
      { id:'whitelabel', question:'Do you offer white-label?',
        keywords:['white label','white-label','rebrand','our own branding'],
        answer:"Yes — white-label options are available as part of the plan, along with a dedicated account manager." }
    ];

    // small talk gets handled before the FAQ match so saying "hi" feels like talking to
    // someone, not like hitting a wall of "I don't understand" — same typing-delay treatment
    const SMALL_TALK = [
      { patterns:['hi','hello','hey','hiya','yo','good morning','good afternoon','good evening'],
        replies:["Hey there! 👋 I'm Nova — how can I help? Ask me about pricing, features, or how Alead works.",
                 "Hi! Great to have you here 🙂 What would you like to know about Alead?"],
        chips:'main' },
      { patterns:['how are you','how are u','hows it going','how you doing','whats up'],
        replies:["Doing great, thanks for asking! 😊 What can I help you with today?"], chips:'follow' },
      { patterns:['thank you','thanks','thx','appreciate it','cheers'],
        replies:["You're welcome! Anything else I can help with?","Anytime — happy to help further if you need it."], chips:'follow' },
      { patterns:['bye','goodbye','see you','talk later','cya'],
        replies:["Take care! Reach out anytime you need us. 👋"], chips:null },
      { patterns:['who are you','are you a bot','are you real','are you human','are you ai'],
        replies:["I'm Nova, Alead's virtual assistant 🦉 — here to get you fast answers. If you'd rather talk to a real person, just say the word."],
        chips:'follow' },
      { patterns:['ok','okay','cool','nice','great','got it','alright','sounds good'],
        replies:["👍 Anything else you'd like to ask?"], chips:'follow' }
    ];
    function matchSmallTalk(text){
      const q = ' ' + text.toLowerCase().trim().replace(/[!.?]+$/, '') + ' ';
      for(const group of SMALL_TALK){
        if(group.patterns.some(p => q.includes(' ' + p + ' '))){
          return { reply: group.replies[Math.floor(Math.random() * group.replies.length)], chips: group.chips };
        }
      }
      return null;
    }

    const MAIN_CHIPS = [
      { label:'💰 Pricing', ask:'pricing' },
      { label:'⚙️ Features', ask:'features' },
      { label:'🏢 Industries', ask:'industries' },
      { label:'🎯 How it works', ask:'how it works' },
      { label:'👋 Talk to our team', action:'lead' }
    ];
    const FOLLOWUP_CHIPS = [
      { label:'Ask something else', action:'menu' },
      { label:'Talk to our team', action:'lead' }
    ];
    const NOMATCH_CHIPS = [
      { label:'Yes, connect me', action:'lead' },
      { label:'Try another question', action:'menu' }
    ];

    function matchFaq(text){
      const q = text.toLowerCase();
      let best = null, bestScore = 0;
      FAQ.forEach(item=>{
        let score = 0;
        item.keywords.forEach(kw=>{ if(q.includes(kw)) score += kw.split(' ').length; });
        if(score > bestScore){ bestScore = score; best = item; }
      });
      return best;
    }

    const transcript = [];
    let started = false;

    function scrollToEnd(){ body.scrollTop = body.scrollHeight; }

    function addMessage(role, text){
      const el = document.createElement('div');
      el.className = 'cw-msg ' + role;
      const p = document.createElement('p');
      p.textContent = text;
      el.appendChild(p);
      body.appendChild(el);
      scrollToEnd();
    }

    function addChips(list){
      const wrap = document.createElement('div');
      wrap.className = 'cw-chips';
      list.forEach(item=>{
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cw-chip';
        btn.textContent = item.label;
        btn.addEventListener('click', function(){
          Array.from(wrap.querySelectorAll('.cw-chip')).forEach(b => b.disabled = true);
          if(item.action === 'lead') showLeadForm();
          else if(item.action === 'menu'){ addMessage('bot', 'Sure — what else would you like to know?'); addChips(MAIN_CHIPS); }
          else ask(item.ask, item.label);
        });
        wrap.appendChild(btn);
      });
      body.appendChild(wrap);
      scrollToEnd();
    }

    function showTyping(){
      const el = document.createElement('div');
      el.className = 'cw-typing';
      el.id = 'cwTyping';
      el.innerHTML = '<i></i><i></i><i></i>';
      body.appendChild(el);
      scrollToEnd();
    }
    function hideTyping(){
      const el = document.getElementById('cwTyping');
      if(el) el.remove();
    }

    function ask(text, displayText){
      addMessage('user', displayText || text);
      showTyping();
      setTimeout(function(){
        hideTyping();
        const smallTalk = matchSmallTalk(text);
        if(smallTalk){
          addMessage('bot', smallTalk.reply);
          transcript.push({ q: displayText || text, a: smallTalk.reply });
          if(smallTalk.chips === 'main') addChips(MAIN_CHIPS);
          else if(smallTalk.chips === 'follow') addChips(FOLLOWUP_CHIPS);
          return;
        }
        const match = matchFaq(text);
        if(match){
          addMessage('bot', match.answer);
          transcript.push({ q: displayText || text, a: match.answer });
          addChips(FOLLOWUP_CHIPS);
        } else {
          const fallback = "I don't have a ready answer for that one — want me to connect you with our team? They'll follow up by email.";
          addMessage('bot', fallback);
          transcript.push({ q: displayText || text, a: '(no confident match — offered handoff to the team)' });
          addChips(NOMATCH_CHIPS);
        }
      }, 550 + Math.random() * 350);
    }

    function showLeadForm(){
      const card = document.createElement('div');
      card.className = 'cw-lead';
      card.innerHTML =
        '<input type="text" name="name" maxlength="120" placeholder="Your name">' +
        '<input type="email" name="email" maxlength="200" placeholder="you@company.com">' +
        '<input type="tel" name="phone" maxlength="30" placeholder="+91 98765 43210">' +
        '<textarea name="message" maxlength="1000" rows="2" placeholder="Anything specific we should know? (optional)"></textarea>' +
        '<button type="submit">Send to our team</button>' +
        '<p class="cw-lead__status" role="status"></p>';
      body.appendChild(card);
      scrollToEnd();

      card.querySelector('button').addEventListener('click', async function(){
        const btn = card.querySelector('button');
        const status = card.querySelector('.cw-lead__status');
        const name = card.querySelector('[name="name"]').value.trim();
        const email = card.querySelector('[name="email"]').value.trim();
        const phone = card.querySelector('[name="phone"]').value.trim();
        const message = card.querySelector('[name="message"]').value.trim();
        if(!email && !phone){
          status.textContent = 'Share an email or phone number so we can get back to you.';
          status.className = 'cw-lead__status is-error';
          return;
        }
        btn.disabled = true;
        status.textContent = '';
        status.className = 'cw-lead__status';
        try{
          const transcriptText = transcript.length
            ? transcript.map(t => 'Q: ' + t.q + '\nA: ' + t.a).join('\n\n')
            : '(no questions asked before requesting contact)';
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, message, source: 'chatbot', transcript: transcriptText }),
          });
          const result = await res.json();
          if(res.ok && result.ok){
            status.textContent = "Thanks — we'll email you shortly.";
            status.classList.add('is-success');
            Array.from(card.querySelectorAll('input, textarea')).forEach(f => f.disabled = true);
            btn.remove();
          } else {
            status.textContent = result.error || 'Something went wrong. Please try again.';
            status.classList.add('is-error');
            btn.disabled = false;
          }
        } catch(err){
          status.textContent = "Couldn't reach the server. Please try again in a moment.";
          status.classList.add('is-error');
          btn.disabled = false;
        }
      });
    }

    function startConversation(){
      if(started) return;
      started = true;
      addMessage('bot', "Hey, I'm Nova 🦉 — ask me about pricing, features, or how Alead works. Or just tell our team what you need.");
      addChips(MAIN_CHIPS);
    }

    function openPanel(){
      widget.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      launcher.setAttribute('aria-expanded', 'true');
      greet.hidden = true;
      badge.hidden = true;
      try{ localStorage.setItem('aleadChatOpened', '1'); }catch(e){}
      startConversation();
      input.focus();
    }
    function closePanel(){
      widget.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      launcher.setAttribute('aria-expanded', 'false');
    }

    launcher.addEventListener('click', function(){
      if(widget.classList.contains('is-open')) closePanel(); else openPanel();
    });
    closeBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && widget.classList.contains('is-open')) closePanel();
    });
    document.addEventListener('click', function(e){
      if(widget.classList.contains('is-open') && !widget.contains(e.target)) closePanel();
    });

    if(greetClose){
      greetClose.addEventListener('click', function(e){
        e.stopPropagation();
        greet.hidden = true;
        try{ localStorage.setItem('aleadChatGreeted', '1'); }catch(e2){}
      });
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      const text = input.value.trim();
      if(!text) return;
      input.value = '';
      ask(text);
    });

    // first-time visitors get a one-off greeting bubble; returning visitors just see the launcher
    let alreadyGreeted = false;
    try{ alreadyGreeted = !!localStorage.getItem('aleadChatGreeted') || !!localStorage.getItem('aleadChatOpened'); }catch(e){}
    if(!alreadyGreeted){
      setTimeout(function(){
        if(widget.classList.contains('is-open')) return;
        greet.hidden = false;
        try{ localStorage.setItem('aleadChatGreeted', '1'); }catch(e2){}
      }, 2600);
    } else {
      greet.hidden = true;
      badge.hidden = true;
    }
  })();
