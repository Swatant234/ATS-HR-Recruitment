/* ==========================================================================
   PRO-ATS — SHARED APP SHELL
   Injects the sidebar, topbar and logout-confirmation modal into every page
   from a single source, and wires up the interactive behaviour that's
   common to all of them (sidebar collapse/hide, fullscreen, dark mode,
   nav highlighting, logout confirmation).

   Each page sets `window.PAGE` BEFORE loading this script, e.g.:

   <script>
     window.PAGE = {
       active: 'profile-database',   // matches data-nav below
       crumbs: [
         { label: 'Profile Database', href: 'pro-ats-profile-database.html' }
       ]
     };
   </script>
   <script src="app.js"></script>
   ========================================================================== */

(function(){

  const THEME_STORAGE_KEY = 'proats-theme';

  // apply saved dark-mode preference immediately (before mount/wireBehaviour run)
  // so it survives every page navigation instead of resetting to light on each load.
  // A fresh browser/session has no stored key, so it still defaults to light.
  if(localStorage.getItem(THEME_STORAGE_KEY) === 'dark'){
    document.body.classList.add('dark');
  }

  const NAV_ITEMS = [
    { section: 'Overview', items: [
      { key:'dashboard', label:'Dashboard', icon:'fa-solid fa-gauge-high', href:'dashboard.html' },
    ]},
    { section: 'Recruitment', items: [
      { key:'recruitment-overview',   label:'Recruitment Overview',   icon:'fa-solid fa-chart-column', href:'recruitment-overview.html' },
      { key:'requisition-initiation', label:'Requisition Initiation', icon:'fa-regular fa-file-lines', href:'requisition-initiation.html' },
      { key:'profile-database',       label:'Profile Database',       icon:'fa-solid fa-database',     href:'pro-ats-profile-database.html' },
      { key:'interview-progress',     label:'Interview Progress',     icon:'fa-regular fa-clipboard',  href:'interview-progress.html' },
      { key:'fitment-stage',          label:'Fitment Stage',          icon:'fa-solid fa-user-check',   href:'fitment-stage.html' },
    ]},
    { section: 'Offers', items: [
      { key:'offer-approval', label:'Offer Approval', icon:'fa-regular fa-circle-check', href:'offer-approval.html' },
      { key:'offer-released', label:'Offer Released', icon:'fa-solid fa-paper-plane',    href:'offer-released.html' },
    ]},
    { section: 'Engagement', items: [
      { key:'resource-followup', label:'Resource Follow Up', icon:'fa-regular fa-bell',      href:'resource-followup.html' },
      { key:'reports',           label:'Reports',            icon:'fa-regular fa-file-lines', href:'#' },
    ]},
    { section: 'Configurations', items: [
      { key:'role-configuration', label:'Role Configuration', icon:'fa-solid fa-user-gear', href:'role-configuration.html' },
      { key:'screen-privileges',  label:'Screen Privileges',  icon:'fa-solid fa-shield-halved', href:'screen-privileges.html' },
    ]},
  ];

  function sidebarHTML(activeKey){
    const sections = NAV_ITEMS.map(sec => `
      <div class="nav-section-label">${sec.section}</div>
      ${sec.items.map(it => `
        <a href="${it.href}" class="nav-item${it.key === activeKey ? ' active' : ''}" data-tooltip="${it.label}">
          <i class="${it.icon}"></i><span>${it.label}</span>
        </a>
      `).join('')}
    `).join('');

    return `
      <aside class="sidebar" id="sidebar">
        <button type="button" class="sidebar-toggle-btn" id="sidebarToggleBtn" title="Collapse sidebar">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <div class="sidebar-brand">
          <div class="brand-mark">PA</div>
          <div class="brand-text">
            <div class="name">PRO-<span>ATS</span></div>
            <div class="sub">Recruitment Platform</div>
          </div>
        </div>
        <div class="nav-scroll">${sections}</div>
        <div class="sidebar-footer">
          <button type="button" class="logout-btn" id="logoutTrigger" data-tooltip="Log Out">
            <i class="fa-solid fa-arrow-right-from-bracket"></i><span>Log Out</span>
          </button>
        </div>
      </aside>
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;
  }

  function breadcrumbHTML(crumbs){
    const isHome = !crumbs || !crumbs.length;

    if(isHome){
      return `
        <i class="fa-solid fa-house"></i>
        <span>/</span>
        <span class="current">Dashboard</span>
      `;
    }

    const parts = crumbs.map((c, i) => {
      const isLast = i === crumbs.length - 1;
      if(isLast) return `<span class="current">${c.label}</span>`;
      return `<a href="${c.href}">${c.label}</a><i class="fa-solid fa-chevron-right" style="font-size:9px"></i>`;
    });
    return `
      <a href="dashboard.html"><i class="fa-solid fa-house"></i></a>
      <span>/</span>
      ${parts.join('')}
    `;
  }

  function topbarHTML(crumbs){
    return `
      <div class="header-wrap" id="headerWrap">
        <div class="app-header" id="appHeader">
          <div class="topbar fade-up">
            <button class="icon-btn" id="hideSidebarBtn" title="Hide sidebar"><i class="fa-solid fa-table-columns"></i></button>
            <button class="icon-btn" id="fullscreenBtn" title="Full screen"><i class="fa-solid fa-expand" id="fullscreenIcon"></i></button>

            <div class="topbar-actions">
              <button class="icon-btn" id="themeToggle" title="Toggle dark mode"><i class="fa-regular fa-moon" id="themeIcon"></i></button>
              <div class="user-chip" id="userChipBtn">
                <div class="avatar">JJ</div>
                <div class="who d-none d-sm-block">
                  <div class="name">John</div>
                  <div class="role">Admin</div>
                </div>
                <i class="fa-solid fa-chevron-down" id="userChipCaret" style="font-size:9px;color:var(--text-secondary); transition:transform .18s ease;"></i>
              </div>
            </div>
          </div>
          <div class="breadcrumb-bar">
            <div class="breadcrumb-mini">${breadcrumbHTML(crumbs)}</div>
          </div>
        </div>
        <button type="button" class="header-toggle-btn" id="headerToggleBtn" title="Hide header">
          <i class="fa-solid fa-angles-up" id="headerToggleIcon"></i>
        </button>
      </div>
    `;
  }

  function userPopoverHTML(){
    return `
      <div class="user-popover" id="userPopover">
        <div class="up-header">
          <div class="up-avatar">JJ</div>
          <div class="up-id">
            <div class="up-name">John Jacob</div>
            <span class="up-role-chip">Admin</span>
          </div>
        </div>
        <div class="up-divider"></div>
        <div class="up-row">
          <div class="up-row-icon up-row-icon-amber"><i class="fa-regular fa-id-badge"></i></div>
          <div class="up-row-text">
            <div class="up-row-label">Employee ID</div>
            <div class="up-row-value">PT-1001</div>
          </div>
        </div>
        <div class="up-row">
          <div class="up-row-icon up-row-icon-blue"><i class="fa-regular fa-envelope"></i></div>
          <div class="up-row-text">
            <div class="up-row-label">Email</div>
            <div class="up-row-value">john.jacob@partech.com</div>
          </div>
        </div>
        <div class="up-row">
          <div class="up-row-icon up-row-icon-violet"><i class="fa-regular fa-building"></i></div>
          <div class="up-row-text">
            <div class="up-row-label">Department</div>
            <div class="up-row-value">Talent Acquisition</div>
          </div>
        </div>
        <div class="up-row">
          <div class="up-row-icon up-row-icon-teal"><i class="fa-solid fa-location-dot"></i></div>
          <div class="up-row-text">
            <div class="up-row-label">Location</div>
            <div class="up-row-value">Hyderabad</div>
          </div>
        </div>
        <div class="up-divider"></div>
        <button type="button" class="up-action" id="userPopoverChangePwd">
          <i class="fa-solid fa-key"></i>Change Password
        </button>
        <button type="button" class="up-logout" id="userPopoverLogout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>Log Out
        </button>
      </div>
    `;
  }

  function changePasswordModalHTML(){
    return `
      <div class="form-modal-backdrop" id="pwdModalBackdrop">
        <form class="form-modal" id="pwdForm" style="max-width:420px;">
          <div class="config-card-head">
            <div>
              <h2>Change Password</h2>
              <p>Choose a new password for your account.</p>
            </div>
            <button type="button" class="modal-close" id="pwdCloseBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="config-card-body">
            <div class="config-field">
              <label>Current Password</label>
              <input type="password" placeholder="Enter current password" required>
            </div>
            <div class="config-field">
              <label>New Password</label>
              <input type="password" placeholder="Enter new password" required>
            </div>
            <div class="config-field" style="margin-bottom:6px;">
              <label>Confirm New Password</label>
              <input type="password" placeholder="Re-enter new password" required>
            </div>
          </div>
          <div class="config-card-actions">
            <button type="button" class="btn-outline-soft" id="pwdCancelBtn">Cancel</button>
            <button type="submit" class="btn-primary-grad"><i class="fa-solid fa-key"></i>Update Password</button>
          </div>
        </form>
      </div>
    `;
  }

  function logoutModalHTML(){
    return `
      <div class="modal-backdrop-custom" id="logoutBackdrop">
        <div class="confirm-modal">
          <div class="confirm-icon"><i class="fa-solid fa-arrow-right-from-bracket"></i></div>
          <h3>Log out of PRO-ATS?</h3>
          <p>You'll need to sign in again to access the recruitment platform.</p>
          <div class="confirm-actions">
            <button type="button" class="btn-outline-soft" id="logoutCancel">No, stay</button>
            <button type="button" class="btn-danger-solid" id="logoutConfirm"><i class="fa-solid fa-check"></i>Yes, log out</button>
          </div>
        </div>
      </div>
    `;
  }

  function mount(){
    const cfg = window.PAGE || {};

    // ---- sidebar ----
    const sidebarMount = document.getElementById('sidebarMount');
    if(sidebarMount) sidebarMount.outerHTML = sidebarHTML(cfg.active);

    // ---- topbar ----
    const topbarMount = document.getElementById('topbarMount');
    if(topbarMount) topbarMount.outerHTML = topbarHTML(cfg.crumbs);

    // ---- logout modal ----
    document.body.insertAdjacentHTML('beforeend', logoutModalHTML());

    // ---- change password modal ----
    document.body.insertAdjacentHTML('beforeend', changePasswordModalHTML());

    // ---- user profile popover ----
    document.body.insertAdjacentHTML('beforeend', userPopoverHTML());

    wireBehaviour();
  }

  function wireBehaviour(){
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('main');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    const openMobileSidebar = ()=>{
      sidebar.classList.add('mobile-open');
      if(sidebarOverlay) sidebarOverlay.classList.add('show');
      if(hideSidebarBtn) hideSidebarBtn.classList.add('active-icon');
    };
    const closeMobileSidebar = ()=>{
      sidebar.classList.remove('mobile-open');
      if(sidebarOverlay) sidebarOverlay.classList.remove('show');
      if(hideSidebarBtn) hideSidebarBtn.classList.remove('active-icon');
    };

    // hide sidebar completely (desktop) / open-close drawer (narrow screens)
    const hideSidebarBtn = document.getElementById('hideSidebarBtn');
    if(hideSidebarBtn){
      hideSidebarBtn.addEventListener('click', ()=>{
        if(window.innerWidth <= 640){
          sidebar.classList.contains('mobile-open') ? closeMobileSidebar() : openMobileSidebar();
          return;
        }
        sidebar.classList.toggle('hidden');
        main.classList.toggle('sidebar-hidden');
        hideSidebarBtn.classList.toggle('active-icon');
      });
    }

    // tapping outside the drawer (the overlay) closes it on mobile
    if(sidebarOverlay){
      sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }
    // also close after picking a nav link, in case the page doesn't navigate away
    sidebar.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', () => { if(window.innerWidth <= 640) closeMobileSidebar(); });
    });

    // collapse sidebar to icon-only ("half") rail
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if(sidebarToggleBtn){
      const applyCollapsed = (collapsed)=>{
        sidebar.classList.toggle('collapsed', collapsed);
        main.classList.toggle('sidebar-collapsed', collapsed);
        sidebarToggleBtn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
      };
      applyCollapsed(localStorage.getItem('sidebarCollapsed') === '1');
      sidebarToggleBtn.addEventListener('click', ()=>{
        const collapsed = !sidebar.classList.contains('collapsed');
        applyCollapsed(collapsed);
        localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
        // toggling collapse/expand should always leave the sidebar visible,
        // even if it had been fully hidden via the "hide sidebar" button
        if(sidebar.classList.contains('hidden')){
          sidebar.classList.remove('hidden');
          main.classList.remove('sidebar-hidden');
          if(hideSidebarBtn) hideSidebarBtn.classList.remove('active-icon');
        }
      });
    }

    // hide/show header (topbar + breadcrumb strip)
    const HEADER_HIDDEN_STORAGE_KEY = 'proats-header-hidden';
    const appHeader = document.getElementById('appHeader');
    const headerToggleBtn = document.getElementById('headerToggleBtn');
    const headerToggleIcon = document.getElementById('headerToggleIcon');
    if(headerToggleBtn && appHeader){
      const applyHeaderHidden = (hidden)=>{
        appHeader.classList.toggle('hidden', hidden);
        headerToggleIcon.className = hidden ? 'fa-solid fa-angles-down' : 'fa-solid fa-angles-up';
        headerToggleBtn.title = hidden ? 'Show header' : 'Hide header';
      };
      applyHeaderHidden(localStorage.getItem(HEADER_HIDDEN_STORAGE_KEY) === '1');
      headerToggleBtn.addEventListener('click', ()=>{
        const hidden = !appHeader.classList.contains('hidden');
        applyHeaderHidden(hidden);
        localStorage.setItem(HEADER_HIDDEN_STORAGE_KEY, hidden ? '1' : '0');
      });
    }

    // fullscreen
    const FULLSCREEN_STORAGE_KEY = 'proats-fullscreen';
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    if(fullscreenBtn){
      fullscreenBtn.addEventListener('click', ()=>{
        if(!document.fullscreenElement){
          document.documentElement.requestFullscreen().catch(()=>{});
          sessionStorage.setItem(FULLSCREEN_STORAGE_KEY, '1');
        }else{
          document.exitFullscreen();
          sessionStorage.removeItem(FULLSCREEN_STORAGE_KEY);
        }
      });
      document.addEventListener('fullscreenchange', ()=>{
        fullscreenIcon.className = document.fullscreenElement ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
        if(!document.fullscreenElement) sessionStorage.removeItem(FULLSCREEN_STORAGE_KEY);
      });

      // Browsers exit fullscreen on every page navigation and won't let JS
      // re-request it without a fresh user gesture. If fullscreen was on
      // before navigating, silently re-enter it on the next click that
      // doesn't itself trigger another navigation (attempting it on a
      // navigating link just flashes fullscreen for an instant before the
      // page unloads again, which is the "bounce").
      if(sessionStorage.getItem(FULLSCREEN_STORAGE_KEY) === '1'){
        const reclaimFullscreen = (e) => {
          const link = e.target.closest('a[href]');
          if(link){
            const href = link.getAttribute('href');
            const isNavigating = href && href !== '#' && !href.startsWith('javascript:') && link.target !== '_blank';
            if(isNavigating) return; // let it navigate; try again on the next page
          }
          document.documentElement.requestFullscreen().catch(()=>{});
          document.removeEventListener('click', reclaimFullscreen);
        };
        document.addEventListener('click', reclaimFullscreen);
      }
    }

    // dark mode
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    if(themeToggle){
      // sync icon with whatever state was restored on load (may already be dark)
      themeIcon.className = document.body.classList.contains('dark') ? 'fa-solid fa-sun' : 'fa-regular fa-moon';
      themeToggle.addEventListener('click', ()=>{
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        themeIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-regular fa-moon';
        localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
        if(typeof window.onThemeChange === 'function') window.onThemeChange();
      });
    }

    // logout confirmation
    const logoutTrigger = document.getElementById('logoutTrigger');
    const logoutBackdrop = document.getElementById('logoutBackdrop');
    const logoutCancel = document.getElementById('logoutCancel');
    const logoutConfirm = document.getElementById('logoutConfirm');

    if(logoutTrigger && logoutBackdrop){
      logoutTrigger.addEventListener('click', ()=> logoutBackdrop.classList.add('show'));
      logoutCancel.addEventListener('click', ()=> logoutBackdrop.classList.remove('show'));
      logoutBackdrop.addEventListener('click', (e)=>{ if(e.target === logoutBackdrop) logoutBackdrop.classList.remove('show'); });
      logoutConfirm.addEventListener('click', ()=>{ window.location.href = 'index.html'; });
    }

    // user profile popover
    const userChipBtn = document.getElementById('userChipBtn');
    const userChipCaret = document.getElementById('userChipCaret');
    const userPopover = document.getElementById('userPopover');

    function positionPopover(triggerEl, popoverEl){
      const rect = triggerEl.getBoundingClientRect();
      const gap = 10;
      const margin = 12;

      // measure the popover (must be visible-but-transparent to measure)
      popoverEl.style.visibility = 'hidden';
      popoverEl.classList.add('show');
      const pw = popoverEl.offsetWidth;
      const ph = popoverEl.offsetHeight;

      // right-align to the trigger by default, clamped inside the viewport
      let left = rect.right - pw;
      left = Math.min(left, window.innerWidth - pw - margin);
      left = Math.max(left, margin);

      // open below the trigger; flip above if there isn't room below
      let top = rect.bottom + gap;
      let flipped = false;
      if(top + ph > window.innerHeight - margin){
        top = rect.top - ph - gap;
        flipped = true;
      }
      top = Math.max(top, margin);

      popoverEl.classList.toggle('flip-up', flipped);
      popoverEl.style.left = `${left}px`;
      popoverEl.style.top = `${top}px`;
      popoverEl.style.visibility = '';
    }
    function positionUserPopover(){ positionPopover(userChipBtn, userPopover); }

    function openUserPopover(){
      positionUserPopover();
      userChipCaret.style.transform = 'rotate(180deg)';
    }
    function closeUserPopover(){
      userPopover.classList.remove('show');
      userChipCaret.style.transform = '';
    }

    if(userChipBtn && userPopover){
      userChipBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        userPopover.classList.contains('show') ? closeUserPopover() : openUserPopover();
      });
      document.addEventListener('click', (e)=>{
        if(!userPopover.contains(e.target) && !userChipBtn.contains(e.target)) closeUserPopover();
      });
      document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeUserPopover(); });
      window.addEventListener('resize', ()=>{ if(userPopover.classList.contains('show')) positionUserPopover(); });
      window.addEventListener('scroll', ()=>{ if(userPopover.classList.contains('show')) positionUserPopover(); }, true);

      const userPopoverLogout = document.getElementById('userPopoverLogout');
      if(userPopoverLogout){
        userPopoverLogout.addEventListener('click', ()=>{
          closeUserPopover();
          const backdrop = document.getElementById('logoutBackdrop');
          if(backdrop) backdrop.classList.add('show');
        });
      }

      const userPopoverChangePwd = document.getElementById('userPopoverChangePwd');
      const pwdBackdrop = document.getElementById('pwdModalBackdrop');
      const pwdForm = document.getElementById('pwdForm');
      const pwdCloseBtn = document.getElementById('pwdCloseBtn');
      const pwdCancelBtn = document.getElementById('pwdCancelBtn');
      if(userPopoverChangePwd && pwdBackdrop){
        userPopoverChangePwd.addEventListener('click', ()=>{
          closeUserPopover();
          pwdBackdrop.classList.add('show');
        });
        const closePwdModal = ()=>{ pwdBackdrop.classList.remove('show'); pwdForm.reset(); };
        pwdCloseBtn.addEventListener('click', closePwdModal);
        pwdCancelBtn.addEventListener('click', closePwdModal);
        pwdBackdrop.addEventListener('click', (e)=>{ if(e.target === pwdBackdrop) closePwdModal(); });
        pwdForm.addEventListener('submit', (e)=>{ e.preventDefault(); closePwdModal(); });
      }
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mount);
  }else{
    mount();
  }
})();
