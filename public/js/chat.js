/**
 * MentorBridge Chat Widget
 * Smart rule-based assistant — no API key needed.
 */
(function () {
  'use strict';

  // ── Knowledge base ──────────────────────────────────────────────────────────
  var KB = [
    {
      patterns: ['hello','hi','hey','good morning','good afternoon','good evening','start','help','what can you do'],
      answer: "Hi there! 👋 I'm the MentorBridge assistant. I can help you with:\n• How our AI matching works\n• Finding and connecting with mentors\n• Creating an account\n• Pricing and cost\n• Sessions and requests\n• Career resources\n\nWhat would you like to know?"
    },
    {
      patterns: ['how does','matching work','ai match','compatibility','algorithm','score','how are mentors matched'],
      answer: "Our AI matching engine scores compatibility between you and each mentor across 6 dimensions:\n\n🎯 Programme / career field match\n🛠 Skill overlap\n💡 Shared interests & industries\n🏆 Career goal alignment\n📊 Academic / experience level\n⭐ Mentor rating bonus\n\nEach mentor gets a score out of 100. Your top matches appear on your dashboard immediately after you complete your profile."
    },
    {
      patterns: ['find mentor','browse mentor','search mentor','how to find','look for mentor','discover mentor'],
      answer: "You can find mentors in two ways:\n\n1. **AI Recommendations** — Complete your profile and your dashboard shows your top matches with compatibility scores.\n\n2. **Mentor Directory** — Browse and filter all mentors by industry, skills, career field, experience, and rating.\n\nTap 'Find a mentor' in the navigation or go to /pages/mentor-directory.html to start."
    },
    {
      patterns: ['register','sign up','create account','join','how to join','get started'],
      answer: "Joining MentorBridge is free and takes about 2 minutes:\n\n1. Click **Get started free** in the top navigation\n2. Choose your role: Student or Mentor\n3. Fill in your profile details (programme, skills, career goals)\n4. Submit — you'll be redirected to your dashboard\n\nYour profile details power the AI matching, so the more you add, the better your matches will be."
    },
    {
      patterns: ['free','cost','price','pricing','paid','subscription','fee','charge'],
      answer: "MentorBridge is **completely free for mentees** — no subscriptions, no hidden fees, ever.\n\nMentors give their time voluntarily because they want to invest in the next generation of professionals.\n\nYou can browse mentors, request sessions, access all career resources, and use every platform feature at no cost."
    },
    {
      patterns: ['request','session','book','schedule','how to request','mentorship request'],
      answer: "To request a mentorship session:\n\n1. Find a mentor you like (via your recommendations or the directory)\n2. Open their profile\n3. Click **Request Mentorship**\n4. Select your reason (Career Advice, Mock Interview, etc.)\n5. Write a short message explaining what you need\n6. Hit **Send Request**\n\nThe mentor will be notified and typically responds within 2–3 days."
    },
    {
      patterns: ['verified','how are mentors verified','verification','trust','real','fake','credentials'],
      answer: "Every mentor on MentorBridge goes through a verification process:\n\n✅ Professional credentials checked\n✅ LinkedIn profile validated\n✅ Work history reviewed by our admin team\n\nMentors only go live after passing this review. You'll see a 'Verified' badge on approved mentor profiles."
    },
    {
      patterns: ['forgot password','reset password','cant login','lost password','password reset'],
      answer: "To reset your password:\n\n1. Go to the Sign In page\n2. Click **Forgot password?** below the password field\n3. Enter your registered email address\n4. Click **Send reset link**\n5. Follow the link to set a new password\n\nIf you don't receive the email within a few minutes, check your spam folder."
    },
    {
      patterns: ['resource','guide','resume','cv','interview','career roadmap','career guide','material'],
      answer: "The Resource Centre has 6 free career guides:\n\n📄 Professional Resume Writing Guide\n💼 Ace Your Technical Interview\n🗺 Career Roadmap: Campus to Corporate\n🤝 Networking in the Professional Scene\n🏢 Internship Success Guide\n🎯 SMART Goal Planner\n\nGo to **Resources** in the navigation or visit /pages/resource-centre.html to read any of them."
    },
    {
      patterns: ['mentor','become mentor','want to mentor','mentor account','how to become'],
      answer: "To become a mentor on MentorBridge:\n\n1. Click **Get started free** → choose **Mentor**\n2. Fill in your expertise, industry, and bio\n3. Your application goes to our admin team for verification\n4. Once approved, your profile goes live and students can request sessions with you\n\nMentoring is voluntary and you control your own availability."
    },
    {
      patterns: ['notification','alert','update','email notification'],
      answer: "You can manage your notification preferences in **Settings**:\n\n• Session reminders\n• Mentorship request updates\n• Platform announcements\n\nGo to Settings → Notifications to toggle each type on or off."
    },
    {
      patterns: ['dark mode','theme','light mode','appearance','settings'],
      answer: "You can switch between Light and Dark mode in **Settings → Appearance**.\n\nYour preference is saved automatically and applies across all pages. There's also a 'System default' option that follows your device's theme setting."
    },
    {
      patterns: ['contact','support','help','problem','issue','report','reach','email'],
      answer: "You can reach us through:\n\n📩 **Contact form** — scroll to the bottom of the homepage\n📧 **Email** — support@mentorbridge.com\n💬 **This chat** — for quick questions\n\nWe typically respond within 24 hours on weekdays."
    },
    {
      patterns: ['privacy','data','personal data','gdpr','information','store','collect'],
      answer: "Your privacy matters to us. Here's what you should know:\n\n• We only collect information you provide during registration\n• Your data is used to power AI matching — never sold to third parties\n• You can request deletion of your account and data at any time\n• We use secure storage and encryption in transit\n\nRead our full Privacy Policy at /pages/privacy.html."
    },
    {
      patterns: ['multiple mentor','more than one','change mentor','different mentor','switch mentor'],
      answer: "Absolutely — you can connect with multiple mentors at the same time.\n\nDifferent mentors bring different perspectives and expertise. Many users have one mentor for technical skills and another for career strategy. There's no limit on how many mentorship relationships you can have."
    }
  ];

  var FALLBACK = "I'm not sure about that one — but here are some things I can help with:\n\n• How AI matching works\n• Finding a mentor\n• Creating an account\n• Pricing & cost\n• Requesting sessions\n• Career resources\n\nYou can also reach our team via the Contact form on the homepage.";

  // ── Match user input to KB ──────────────────────────────────────────────────
  function getAnswer(input) {
    var lower = input.toLowerCase().trim();
    for (var i = 0; i < KB.length; i++) {
      var item = KB[i];
      for (var j = 0; j < item.patterns.length; j++) {
        if (lower.indexOf(item.patterns[j]) !== -1) {
          return item.answer;
        }
      }
    }
    return FALLBACK;
  }

  // ── Format answer text (newlines → <br>, **bold**) ──────────────────────────
  function formatText(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // ── Build widget HTML ───────────────────────────────────────────────────────
  var styles = `
    #mb-chat-btn {
      position: fixed; bottom: 1.75rem; right: 1.75rem; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #3A86FF 0%, #2563EB 100%); border: none; cursor: pointer;
      box-shadow: 0 6px 24px rgba(58,134,255,0.45);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; transition: transform 0.2s, box-shadow 0.2s;
    }
    #mb-chat-btn:hover { transform: scale(1.1); box-shadow: 0 8px 32px rgba(58,134,255,0.65); }
    #mb-chat-panel {
      position: fixed; bottom: 5.25rem; right: 1.75rem; z-index: 9998;
      width: 360px; max-height: 520px;
      background: #fff; border-radius: 18px;
      box-shadow: 0 12px 48px rgba(11,31,58,0.22);
      display: flex; flex-direction: column;
      overflow: hidden; font-family: 'Inter', 'Poppins', sans-serif;
      transition: opacity 0.2s, transform 0.2s;
      border: 1px solid rgba(141,153,174,0.25);
    }
    #mb-chat-panel.hidden { opacity: 0; pointer-events: none; transform: translateY(12px); }
    .mb-chat-header {
      background: #1E202F; color: #fff;
      padding: 1rem 1.25rem;
      display: flex; align-items: center; gap: 0.75rem;
    }
    .mb-chat-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #3A86FF 0%, #00D2FF 100%); display: flex; align-items: center;
      justify-content: center; font-size: 1.1rem; flex-shrink: 0;
    }
    .mb-chat-header-info strong { display: block; font-size: 0.9rem; font-weight: 700; }
    .mb-chat-header-info span { font-size: 0.75rem; color: rgba(255,255,255,0.65); }
    .mb-chat-close {
      margin-left: auto; background: none; border: none; color: rgba(255,255,255,0.6);
      cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0.2rem 0.35rem;
      border-radius: 6px; transition: background 0.15s;
    }
    .mb-chat-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .mb-chat-messages {
      flex: 1; overflow-y: auto; padding: 1rem;
      display: flex; flex-direction: column; gap: 0.75rem;
      background: #F8FAFC;
    }
    .mb-msg {
      max-width: 88%; padding: 0.7rem 0.9rem;
      border-radius: 14px; font-size: 0.82rem;
      line-height: 1.6; word-break: break-word;
      animation: mbFadeIn 0.2s ease;
    }
    @keyframes mbFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    .mb-msg--bot {
      background: #fff; color: #2B2D42;
      border: 1px solid rgba(141,153,174,0.25);
      align-self: flex-start; border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(11,31,58,0.06);
    }
    .mb-msg--user {
      background: #1E202F; color: #fff;
      align-self: flex-end; border-bottom-right-radius: 4px;
    }
    .mb-typing {
      display: flex; gap: 4px; align-items: center;
      padding: 0.7rem 0.9rem;
    }
    .mb-typing span {
      width: 7px; height: 7px; border-radius: 50%;
      background: #3A86FF; opacity: 0.4;
      animation: mbBounce 1s infinite;
    }
    .mb-typing span:nth-child(2) { animation-delay: 0.15s; }
    .mb-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes mbBounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); opacity:1; } }
    .mb-chat-footer {
      display: flex; gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid rgba(141,153,174,0.20);
      background: #fff;
    }
    .mb-chat-input {
      flex: 1; border: 1.5px solid rgba(11,31,58,0.15);
      border-radius: 10px; padding: 0.55rem 0.85rem;
      font-size: 0.82rem; font-family: inherit;
      outline: none; transition: border-color 0.15s;
      color: #2B2D42; background: #fff;
    }
    .mb-chat-input:focus { border-color: #3A86FF; }
    .mb-chat-send {
      background: #3A86FF; color: #fff;
      border: none; border-radius: 10px;
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 1rem;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .mb-chat-send:hover { background: #2563EB; }
    .mb-suggestions {
      display: flex; flex-wrap: wrap; gap: 0.4rem;
      padding: 0 1rem 0.75rem;
      background: #F8FAFC;
    }
    .mb-suggestion {
      background: #fff; border: 1px solid rgba(141,153,174,0.25);
      border-radius: 20px; padding: 0.3rem 0.75rem;
      font-size: 0.75rem; color: #2B2D42; cursor: pointer;
      font-family: inherit; transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .mb-suggestion:hover { background: #1E202F; color: #fff; border-color: #1E202F; }
    @media (max-width: 480px) {
      #mb-chat-panel { width: calc(100vw - 2rem); right: 1rem; bottom: 5rem; }
      #mb-chat-btn { bottom: 1rem; right: 1rem; }
    }
  `;

  var SUGGESTIONS = ['How does matching work?', 'Is it free?', 'Find a mentor', 'Request a session', 'Career resources'];
  var WELCOME = "Hello! 👋 I'm the MentorBridge assistant. How can I help you today?\n\nAsk me anything about how the platform works, finding mentors, or getting started.";

  function buildWidget() {
    // Style tag
    var styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Chat button
    var btn = document.createElement('button');
    btn.id = 'mb-chat-btn';
    btn.setAttribute('aria-label', 'Open chat assistant');
    btn.innerHTML = '💬';
    document.body.appendChild(btn);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'mb-chat-panel';
    panel.className = 'hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'MentorBridge chat assistant');
    panel.innerHTML = `
      <div class="mb-chat-header">
        <div class="mb-chat-avatar">🤖</div>
        <div class="mb-chat-header-info">
          <strong>MentorBridge Assistant</strong>
          <span>Typically replies instantly</span>
        </div>
        <button class="mb-chat-close" aria-label="Close chat">✕</button>
      </div>
      <div class="mb-chat-messages" id="mbMessages"></div>
      <div class="mb-suggestions" id="mbSuggestions"></div>
      <div class="mb-chat-footer">
        <input class="mb-chat-input" id="mbInput" type="text" placeholder="Ask a question…" autocomplete="off" />
        <button class="mb-chat-send" id="mbSend" aria-label="Send message">➤</button>
      </div>
    `;
    document.body.appendChild(panel);

    var messages = panel.querySelector('#mbMessages');
    var input    = panel.querySelector('#mbInput');
    var sendBtn  = panel.querySelector('#mbSend');
    var suggsEl  = panel.querySelector('#mbSuggestions');

    // Suggestions
    SUGGESTIONS.forEach(function (s) {
      var el = document.createElement('button');
      el.className = 'mb-suggestion';
      el.textContent = s;
      el.addEventListener('click', function () { handleSend(s); });
      suggsEl.appendChild(el);
    });

    function addMessage(text, isUser) {
      var msg = document.createElement('div');
      msg.className = 'mb-msg ' + (isUser ? 'mb-msg--user' : 'mb-msg--bot');
      msg.innerHTML = isUser ? escapeHtml(text) : formatText(text);
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function escapeHtml(t) {
      return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function showTyping() {
      var t = document.createElement('div');
      t.className = 'mb-msg mb-msg--bot mb-typing';
      t.id = 'mbTyping';
      t.innerHTML = '<span></span><span></span><span></span>';
      messages.appendChild(t);
      messages.scrollTop = messages.scrollHeight;
    }

    function removeTyping() {
      var t = document.getElementById('mbTyping');
      if (t) t.remove();
    }

    function handleSend(text) {
      var val = (text || input.value).trim();
      if (!val) return;
      input.value = '';
      suggsEl.style.display = 'none';
      addMessage(val, true);
      showTyping();
      setTimeout(function () {
        removeTyping();
        addMessage(getAnswer(val), false);
      }, 600 + Math.random() * 400);
    }

    // Events
    btn.addEventListener('click', function () {
      var isHidden = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !isHidden);
      btn.innerHTML = isHidden ? '✕' : '💬';
      if (isHidden && messages.children.length === 0) {
        setTimeout(function () { addMessage(WELCOME, false); }, 200);
      }
      if (isHidden) setTimeout(function () { input.focus(); }, 250);
    });

    panel.querySelector('.mb-chat-close').addEventListener('click', function () {
      panel.classList.add('hidden');
      btn.innerHTML = '💬';
    });

    sendBtn.addEventListener('click', function () { handleSend(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleSend();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
