(function () {
  'use strict';

  /* =======================================================================
     Image uploader
     ======================================================================= */
  function initUploader(root) {
    const preview = root.querySelector('.preview');
    const fileInput = root.querySelector('input[type="file"]');
    const clearBtn = root.querySelector('.clear');
    const drop = root.querySelector('.image-drop');
    const hiddenUrl = root.querySelector('input[name$="[url]"]');
    const hiddenPath = root.querySelector('input[name$="[path]"]');

    function setImage(url, path) {
      if (url) {
        preview.style.backgroundImage = `url('${url.replace(/'/g, "\\'")}')`;
        preview.classList.remove('empty');
        preview.textContent = '';
      } else {
        preview.style.backgroundImage = '';
        preview.classList.add('empty');
        preview.textContent = 'No image';
      }
      if (hiddenUrl) hiddenUrl.value = url || '';
      if (hiddenPath) hiddenPath.value = path || '';
    }

    async function upload(file) {
      if (!file) return;
      drop.classList.add('uploading');
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/admin/upload', {
          method: 'POST',
          body: fd,
          headers: { accept: 'application/json' },
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setImage(data.url, data.path);
      } catch (err) {
        alert('Upload failed: ' + err.message);
      } finally {
        drop.classList.remove('uploading');
      }
    }

    fileInput.addEventListener('change', (e) => upload(e.target.files[0]));
    clearBtn?.addEventListener('click', () => setImage('', ''));

    ['dragenter', 'dragover'].forEach((ev) => {
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach((ev) => {
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('dragover'); });
    });
    drop.addEventListener('drop', (e) => {
      const f = e.dataTransfer.files?.[0];
      if (f) upload(f);
    });
  }

  document.querySelectorAll('[data-uploader]').forEach(initUploader);

  /* =======================================================================
     Repeaters (array of items)
     ======================================================================= */
  function reindex(repeater) {
    const items = Array.from(repeater.querySelectorAll('.repeater-item'));
    items.forEach((item, i) => {
      const idx = item.querySelector('.idx');
      if (idx) idx.textContent = i + 1;
      item.querySelectorAll('[name]').forEach((el) => {
        el.name = el.name.replace(/\[\d+\]/, `[${i}]`);
      });
    });
  }

  function initRepeater(repeater) {
    const addBtn = repeater.parentElement.querySelector(':scope > .repeater-add') ||
      repeater.nextElementSibling?.matches('.repeater-add') ? repeater.nextElementSibling : null;

    // Find add button by walking to next sibling
    let addButton = repeater.nextElementSibling;
    while (addButton && !addButton.matches('.repeater-add')) {
      addButton = addButton.nextElementSibling;
    }

    // Find template
    const tplName = repeater.dataset.template;
    const tpl = repeater.parentElement.querySelector(`template[data-tpl="${tplName}"]`) ||
      repeater.closest('.form').querySelector(`template[data-tpl="${tplName}"]`);

    function bind(item) {
      item.querySelector('.remove-btn')?.addEventListener('click', () => {
        item.remove();
        reindex(repeater);
      });
      item.querySelectorAll('[data-uploader]').forEach(initUploader);
    }

    repeater.querySelectorAll('.repeater-item').forEach(bind);

    if (addButton && tpl) {
      addButton.addEventListener('click', () => {
        const count = repeater.querySelectorAll('.repeater-item').length;
        const html = tpl.innerHTML
          .replace(/__I0__/g, count)
          .replace(/__I__/g, count + 1);
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        const node = div.firstElementChild;
        repeater.appendChild(node);
        bind(node);
      });
    }
  }

  document.querySelectorAll('[data-repeater]').forEach(initRepeater);

  /* =======================================================================
     Chip input
     ======================================================================= */
  function initChip(chipRoot) {
    const name = chipRoot.dataset.name || 'items';
    const input = chipRoot.querySelector('input[type="text"]');

    function addChip(value) {
      value = (value || '').trim();
      if (!value) return;
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `
        <input type="hidden" name="${name}[]" />
        <span></span>
        <button type="button" aria-label="Remove">×</button>
      `;
      chip.querySelector('input').value = value;
      chip.querySelector('span').textContent = value;
      chip.querySelector('button').addEventListener('click', () => chip.remove());
      chipRoot.insertBefore(chip, input);
    }

    chipRoot.querySelectorAll('.chip').forEach((chip) => {
      chip.querySelector('button')?.addEventListener('click', () => chip.remove());
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addChip(input.value);
        input.value = '';
      } else if (e.key === 'Backspace' && input.value === '') {
        const last = chipRoot.querySelectorAll('.chip');
        if (last.length) last[last.length - 1].remove();
      }
    });
    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        addChip(input.value);
        input.value = '';
      }
    });
  }

  document.querySelectorAll('[data-chipinput]').forEach(initChip);

  /* =======================================================================
     Save shortcut (Cmd/Ctrl+S)
     ======================================================================= */
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      const form = document.querySelector('.form-root');
      if (form) {
        e.preventDefault();
        form.submit();
      }
    }
  });
})();
