// Comportamiento compartido de los sitios de la Iglesia y la Fundación Apalir.
(() => {
  const quietos = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menú del teléfono
  const boton = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu');
  if (boton && menu) {
    boton.addEventListener('click', () => {
      const abierto = menu.classList.toggle('abierto');
      boton.setAttribute('aria-expanded', String(abierto));
    });
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) { menu.classList.remove('abierto'); boton.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('abierto')) {
        menu.classList.remove('abierto'); boton.setAttribute('aria-expanded', 'false'); boton.focus();
      }
    });
  }

  // Entrada de la portada (Texts reveal de transitions.dev)
  document.querySelectorAll('.t-stagger').forEach((bloque) => {
    void bloque.offsetHeight;
    requestAnimationFrame(() => bloque.classList.add('is-shown'));
  });

  // Tarjetas que aparecen una sola vez al entrar en pantalla
  const revelar = document.querySelectorAll('.revela');
  if (quietos || !('IntersectionObserver' in window)) {
    revelar.forEach((el) => el.classList.add('visto'));
  } else {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('visto');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revelar.forEach((el) => obs.observe(el));
  }

  // Cifras que cuentan hasta su valor al aparecer
  const DURACION_CUENTA = 1200;
  const contar = (el) => {
    const fin = Number(el.dataset.hasta);
    const sufijo = el.dataset.sufijo || '';
    if (quietos) { el.textContent = fin + sufijo; return; }
    const inicio = performance.now();
    const paso = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / DURACION_CUENTA);
      const suave = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(fin * suave) + sufijo;
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };
  const cifras = document.querySelectorAll('[data-hasta]');
  if ('IntersectionObserver' in window) {
    const obsC = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => { if (en.isIntersecting) { contar(en.target); obsC.unobserve(en.target); } });
    }, { threshold: 0.6 });
    cifras.forEach((el) => obsC.observe(el));
  } else {
    cifras.forEach(contar);
  }

  // Cinta de fotos: botón para detener o seguir el movimiento
  document.querySelectorAll('.cinta').forEach((cinta) => {
    const pausa = cinta.querySelector('.btn-pausa');
    if (!pausa) return;
    if (quietos) { pausa.hidden = true; return; }
    pausa.addEventListener('click', () => {
      const detenida = cinta.classList.toggle('pausada');
      pausa.setAttribute('aria-pressed', String(detenida));
      pausa.textContent = detenida ? 'Seguir' : 'Pausar';
    });
  });

  // Copiar el número de cuenta de donaciones
  const copiar = document.querySelector('.js-copiar');
  if (copiar) {
    const aviso = document.querySelector('.copiado');
    copiar.addEventListener('click', async () => {
      const numero = document.querySelector('.js-cuenta').textContent.trim();
      try {
        await navigator.clipboard.writeText(numero);
        aviso.textContent = 'Número copiado: ' + numero;
      } catch (error) {
        aviso.textContent = 'No se pudo copiar. Anota el número: ' + numero;
      }
    });
  }

  document.querySelectorAll('.js-anio').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
