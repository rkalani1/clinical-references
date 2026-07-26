    (() => {
      const searchInput = document.getElementById('reference-search');
      const resultCount = document.getElementById('reference-count');
      const emptyState = document.getElementById('directory-empty');
      const clearButton = document.getElementById('clear-filters');
      const chips = Array.from(document.querySelectorAll('.category-chip'));
      const cards = Array.from(document.querySelectorAll('#reference-grid > .card'));
      let activeCategory = 'all';

      cards.forEach((card, index) => {
        const title = card.querySelector('h2')?.textContent.trim() || `Reference ${index + 1}`;
        const category = card.querySelector('.category-tag')?.textContent.trim() || '';
        const action = card.querySelector('.card-action');
        const details = card.querySelector('.features-list');

        card.removeAttribute('onclick');
        card.dataset.title = title;
        card.dataset.category = category;
        card.dataset.search = card.textContent.toLowerCase();

        if (action) {
          action.setAttribute('aria-label', `Open ${title}`);
        }

        if (details) {
          const detailsId = `reference-details-${index + 1}`;
          details.id = detailsId;
          const toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'card-details-toggle';
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-controls', detailsId);
          toggle.textContent = 'Show details';
          toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            toggle.textContent = expanded ? 'Show details' : 'Hide details';
            card.classList.toggle('details-open', !expanded);
          });
          details.insertAdjacentElement('afterend', toggle);
        }
      });

      function applyFilters() {
        const query = searchInput.value.trim().toLowerCase();
        let visible = 0;

        cards.forEach((card) => {
          const matchesQuery = !query || card.dataset.search.includes(query);
          const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
          const matches = matchesQuery && matchesCategory;
          card.hidden = !matches;
          if (matches) visible += 1;
        });

        resultCount.textContent = `${visible} ${visible === 1 ? 'reference' : 'references'}`;
        emptyState.hidden = visible !== 0;
      }

      searchInput.addEventListener('input', applyFilters);

      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          activeCategory = chip.dataset.category;
          chips.forEach((candidate) => {
            candidate.setAttribute('aria-pressed', String(candidate === chip));
          });
          applyFilters();
        });
      });

      clearButton.addEventListener('click', () => {
        searchInput.value = '';
        activeCategory = 'all';
        chips.forEach((chip) => {
          chip.setAttribute('aria-pressed', String(chip.dataset.category === 'all'));
        });
        applyFilters();
        searchInput.focus();
      });

      applyFilters();
    })();
