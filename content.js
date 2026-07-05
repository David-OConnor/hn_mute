"use strict";
(() => {
  "use strict";
  const STORAGE_KEY = "mutedUsers";
  const MUTED_PATH = "/muted";
  // Chrome MV3's `chrome` namespace is also promise-based, so either
  // namespace works with await.
  const ext =
    typeof browser !== "undefined" && browser.storage ? browser : chrome;
  const store = ext.storage.sync;
  let muted = {};
  const isMutedPage = location.pathname === MUTED_PATH;
  const isMuted = (name) => Object.prototype.hasOwnProperty.call(muted, name);
  function saveMuted() {
    void store.set({ [STORAGE_KEY]: muted });
  }
  function muteUser(name) {
    if (!name || isMuted(name)) return;
    muted[name] = { notes: "", mutedAt: Date.now() };
    saveMuted();
    applyAll();
  }
  function unmuteUser(name) {
    if (!isMuted(name)) return;
    delete muted[name];
    saveMuted();
    applyAll();
  }
  // ------------------------------------------------------------------
  // "mute" links next to usernames (comments + story subtext lines)
  // ------------------------------------------------------------------
  function addMuteLinks() {
    const users = document.querySelectorAll(
      "span.comhead a.hnuser, td.subtext a.hnuser",
    );
    users.forEach((u) => {
      const next = u.nextElementSibling;
      if (next && next.classList.contains("hnmute-link")) return; // already added
      const name = u.textContent?.trim();
      if (!name) return;
      const a = document.createElement("a");
      a.textContent = "mute";
      a.className = "hnmute-link";
      a.href = "#";
      a.title = "Mute " + name + " — hide all their stories and comments";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        muteUser(name);
      });
      u.after(" ", a);
    });
  }
  // ------------------------------------------------------------------
  // "muted users" link in the orange top bar
  // ------------------------------------------------------------------
  function addNavLink() {
    const pagetop = document.querySelector("span.pagetop"); // first one = nav links
    if (!pagetop || pagetop.querySelector(".hnmute-nav")) return;
    const a = document.createElement("a");
    a.href = MUTED_PATH;
    a.textContent = "muted users";
    a.className = "hnmute-nav";
    pagetop.append(" | ", a);
  }
  // ------------------------------------------------------------------
  // Hiding muted content
  // ------------------------------------------------------------------
  function commentAuthor(row) {
    const u = row.querySelector("a.hnuser");
    return u?.textContent?.trim() ?? null;
  }
  function getIndent(row) {
    const ind = row.querySelector("td.ind");
    if (!ind) return 0;
    const attr = ind.getAttribute("indent");
    if (attr !== null) return parseInt(attr, 10) || 0;
    const img = ind.querySelector("img");
    return img
      ? Math.round((parseInt(img.getAttribute("width") ?? "0", 10) || 0) / 40)
      : 0;
  }
  // Reset a comment row, then hide it or turn it into a "(Muted user)"
  // placeholder (used when it still has visible replies underneath).
  function setCommentRowMuted(row, mute, keepPlaceholder) {
    row.classList.remove("hnmute-hidden", "hnmute-muted-row");
    const old = row.querySelector(".hnmute-placeholder");
    if (old) old.remove();
    if (!mute) return;
    const td = row.querySelector("td.default");
    if (keepPlaceholder && td) {
      row.classList.add("hnmute-muted-row");
      const p = document.createElement("div");
      p.className = "hnmute-placeholder";
      p.textContent = "(Muted user)";
      td.insertBefore(p, td.firstChild);
    } else {
      row.classList.add("hnmute-hidden");
    }
  }
  function applyComments() {
    const rows = Array.from(document.querySelectorAll("tr.athing.comtr"));
    const indents = rows.map(getIndent);
    const authors = rows.map(commentAuthor);
    rows.forEach((row, i) => {
      const name = authors[i];
      if (!(name && isMuted(name))) {
        setCommentRowMuted(row, false, false);
        return;
      }
      // Keep a placeholder only if some descendant comment is visible
      // (i.e. written by a non-muted user); otherwise hide the row.
      let hasVisibleDescendant = false;
      for (let j = i + 1; j < rows.length && indents[j] > indents[i]; j++) {
        const other = authors[j];
        if (!(other && isMuted(other))) {
          hasVisibleDescendant = true;
          break;
        }
      }
      setCommentRowMuted(row, true, hasVisibleDescendant);
    });
  }
  // Story rows on list pages (news, newest, ask, show, past, ...)
  function applyStories() {
    document.querySelectorAll("td.subtext").forEach((sub) => {
      if (sub.closest("table.fatitem")) return; // item page story handled below
      const subRow = sub.closest("tr");
      const athing = subRow?.previousElementSibling;
      if (!subRow || !athing || !athing.classList.contains("athing")) return;
      const u = sub.querySelector("a.hnuser");
      const name = u?.textContent?.trim();
      const hide = !!(name && isMuted(name));
      athing.classList.toggle("hnmute-hidden", hide);
      subRow.classList.toggle("hnmute-hidden", hide);
      const spacer = subRow.nextElementSibling;
      if (spacer && spacer.classList.contains("spacer")) {
        spacer.classList.toggle("hnmute-hidden", hide);
      }
    });
  }
  // The story (or permalinked comment) at the top of an item page. Its
  // replies must stay readable, so it becomes a placeholder, not hidden.
  function applyFatitem() {
    const fat = document.querySelector("table.fatitem");
    if (!fat) return;
    fat
      .querySelectorAll("tr.hnmute-fat-placeholder")
      .forEach((r) => r.remove());
    const athing = fat.querySelector("tr.athing");
    if (!athing) return;
    // Comment permalink page: the fatitem is a comment.
    if (athing.querySelector("td.default .comhead")) {
      const name = commentAuthor(athing);
      setCommentRowMuted(athing, !!(name && isMuted(name)), true);
      return;
    }
    // Story item page.
    const u = fat.querySelector("td.subtext a.hnuser");
    const name = u?.textContent?.trim();
    const hide = !!(name && isMuted(name));
    const rowsToHide = [athing];
    const subRow = fat.querySelector("td.subtext")?.closest("tr");
    if (subRow) rowsToHide.push(subRow);
    const textRow = fat.querySelector(".toptext")?.closest("tr"); // Ask HN / text posts
    if (textRow) rowsToHide.push(textRow);
    rowsToHide.forEach((r) => r.classList.toggle("hnmute-hidden", hide));
    if (hide) {
      const tr = document.createElement("tr");
      tr.className = "hnmute-fat-placeholder";
      const td = document.createElement("td");
      td.colSpan = 3;
      td.className = "hnmute-placeholder";
      td.textContent = "(Muted user)";
      tr.appendChild(td);
      athing.parentNode?.insertBefore(tr, athing);
    }
  }
  function applyAll() {
    applyComments();
    applyStories();
    applyFatitem();
  }
  // ------------------------------------------------------------------
  // The "muted users" page (rendered over HN's 404 page at /muted)
  // ------------------------------------------------------------------
  const NAV_LINKS = [
    ["new", "newest"],
    ["past", "front"],
    ["comments", "newcomments"],
    ["ask", "ask"],
    ["show", "show"],
    ["jobs", "jobs"],
    ["submit", "submit"],
  ];
  function renderMutedPage() {
    document.title = "Muted Users | Hacker News";
    // HN's 404 is plain text, so pull in the real stylesheet + favicon.
    if (!document.querySelector('link[rel="stylesheet"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.type = "text/css";
      css.href = "/news.css";
      document.head.appendChild(css);
    }
    if (!document.querySelector('link[rel~="icon"]')) {
      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.href = "/y18.svg";
      document.head.appendChild(icon);
    }
    document.body.textContent = "";
    document.body.classList.add("hnmute-page");
    const center = document.createElement("center");
    const hnmain = document.createElement("table");
    hnmain.id = "hnmain";
    hnmain.setAttribute("border", "0");
    hnmain.setAttribute("cellpadding", "0");
    hnmain.setAttribute("cellspacing", "0");
    hnmain.setAttribute("width", "85%");
    hnmain.setAttribute("bgcolor", "#f6f6ef");
    // Static chrome only (no user data) — safe as innerHTML.
    const navHtml = NAV_LINKS.map(
      ([label, href]) => '<a href="' + href + '">' + label + "</a>",
    ).join(" | ");
    hnmain.innerHTML =
      '<tr><td bgcolor="#ff6600">' +
      '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding:2px">' +
      "<tr>" +
      '<td style="width:18px;padding-right:4px"><a href="news"><img src="y18.svg" width="18" height="18" style="border:1px white solid;display:block"></a></td>' +
      '<td style="line-height:12pt;height:10px"><span class="pagetop"><b class="hnname"><a href="news">Hacker News</a></b>' +
      navHtml +
      ' | <span class="hnmute-topsel">muted users</span></span></td>' +
      "</tr>" +
      "</table>" +
      "</td></tr>" +
      '<tr id="pagespace" title="Muted Users" style="height:10px"></tr>' +
      '<tr><td class="hnmute-content"></td></tr>' +
      '<tr style="height:20px"></tr>';
    const content = hnmain.querySelector(".hnmute-content");
    const listWrap = document.createElement("div");
    listWrap.className = "hnmute-list";
    content?.appendChild(listWrap);
    center.appendChild(hnmain);
    document.body.appendChild(center);
    renderMutedList(listWrap);
  }
  function renderMutedList(wrap) {
    wrap.textContent = "";
    const names = Object.keys(muted).sort((a, b) => a.localeCompare(b));
    if (names.length === 0) {
      const p = document.createElement("p");
      p.className = "hnmute-empty";
      p.textContent =
        'No muted users. Click the "mute" link next to a username on any story or comment to mute that user.';
      wrap.appendChild(p);
      return;
    }
    const table = document.createElement("table");
    table.className = "hnmute-table";
    names.forEach((name) => {
      const tr = document.createElement("tr");
      const tdUser = document.createElement("td");
      tdUser.className = "hnmute-user";
      const link = document.createElement("a");
      link.href = "user?id=" + encodeURIComponent(name);
      link.textContent = name;
      tdUser.appendChild(link);
      const tdUnmute = document.createElement("td");
      const un = document.createElement("a");
      un.href = "#";
      un.textContent = "unmute";
      un.className = "hnmute-unmute";
      un.addEventListener("click", (e) => {
        e.preventDefault();
        unmuteUser(name);
        renderMutedList(wrap);
      });
      tdUnmute.appendChild(un);
      const tdNotes = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.className = "hnmute-notes-input";
      input.placeholder = "notes";
      input.value = muted[name]?.notes ?? "";
      let timer;
      const save = () => {
        if (isMuted(name)) {
          muted[name].notes = input.value;
          saveMuted();
        }
      };
      input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = window.setTimeout(save, 600); // debounce to respect storage.sync write quotas
      });
      input.addEventListener("change", () => {
        clearTimeout(timer);
        save();
      });
      tdNotes.appendChild(input);
      tr.append(tdUser, tdUnmute, tdNotes);
      table.appendChild(tr);
    });
    wrap.appendChild(table);
  }
  // ------------------------------------------------------------------
  // Keep in sync with changes from other tabs / devices
  // ------------------------------------------------------------------
  ext.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes[STORAGE_KEY]) return;
    const newVal = changes[STORAGE_KEY].newValue ?? {};
    const namesChanged =
      Object.keys(newVal).sort().join("\n") !==
      Object.keys(muted).sort().join("\n");
    muted = newVal;
    if (isMutedPage) {
      // Only re-render when the user set changed, so typing a note
      // (which also fires onChanged) doesn't blow away the input focus.
      const wrap = document.querySelector(".hnmute-list");
      if (wrap && namesChanged) renderMutedList(wrap);
    } else {
      applyAll();
    }
  });
  // ------------------------------------------------------------------
  async function init() {
    const res = await store.get(STORAGE_KEY);
    muted = (res && res[STORAGE_KEY]) || {};
    if (isMutedPage) {
      renderMutedPage();
    } else {
      addNavLink();
      addMuteLinks();
      applyAll();
    }
  }
  void init();
})();
