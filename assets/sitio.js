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

  // Entrada con la paloma (3 s): aparece cada vez que se abre el inicio.
  // La paloma se dibuja cuadro por cuadro en un canvas desde una hoja de 45 cuadros:
  // así se mueve aunque el teléfono tenga «Reducir movimiento» o ahorro de batería
  // (esos ajustes detienen videos e imágenes animadas, pero no un canvas).
  const DURACION_INTRO = 3000;
  const DESTELLO_INTRO = 2300;    // el destello empieza antes del final y abre la página
  const SALIDA_INTRO = 700;
  const ESPERA_MEDIO = 5000;      // si los cuadros no cargan en este tiempo, se abre la página
  const CUADROS = { total: 45, columnas: 9, ancho: 384, alto: 516, porSegundo: 15 };
  const raiz = document.documentElement;
  const intro = document.querySelector('.intro');
  const introLista = new Promise((listo) => {
    if (!intro || !raiz.classList.contains('con-intro')) { listo(); return; }
    let terminada = false;
    let corriendo = false;
    let relojes = [];
    const terminar = () => {
      if (terminada) return;
      terminada = true;
      relojes.forEach(clearTimeout);
      intro.classList.add('intro-fin');
      listo();
      setTimeout(() => raiz.classList.remove('con-intro'), SALIDA_INTRO);
    };
    const encender = () => intro.classList.add('intro-luz');
    const salirPronto = () => {
      if (terminada) return;
      relojes.forEach(clearTimeout);
      encender();
      relojes = [setTimeout(terminar, DURACION_INTRO - DESTELLO_INTRO)];
    };
    const lienzo = intro.querySelector('.intro-lienzo');
    const ctx = lienzo && lienzo.getContext('2d');
    const hoja = new Image();
    const dibujar = (i) => {
      const c = Math.min(i, CUADROS.total - 1);
      ctx.drawImage(hoja, (c % CUADROS.columnas) * CUADROS.ancho, Math.floor(c / CUADROS.columnas) * CUADROS.alto,
        CUADROS.ancho, CUADROS.alto, 0, 0, CUADROS.ancho, CUADROS.alto);
    };
    const arrancar = () => {
      if (corriendo || terminada) return;
      corriendo = true;
      intro.classList.add('corriendo');
      dibujar(0);
      const inicio = performance.now();
      let ultimo = 0;
      // setInterval (no requestAnimationFrame) para que siga aun si el navegador frena los cuadros de animación
      const animar = setInterval(() => {
        const i = Math.floor((performance.now() - inicio) / (1000 / CUADROS.porSegundo));
        if (i !== ultimo) { ultimo = i; dibujar(i); }
        if (i >= CUADROS.total - 1 || terminada) clearInterval(animar);
      }, 1000 / CUADROS.porSegundo / 2);
      relojes = [setTimeout(encender, DESTELLO_INTRO), setTimeout(terminar, DURACION_INTRO)];
    };
    if (ctx) {
      hoja.addEventListener('load', arrancar, { once: true });
      hoja.addEventListener('error', salirPronto, { once: true });
      hoja.src = 'assets/intro/paloma-cuadros.jpg';
      if (hoja.complete && hoja.naturalWidth) arrancar();
    }
    setTimeout(() => { if (!corriendo) salirPronto(); }, ESPERA_MEDIO);
    const saltar = intro.querySelector('.intro-saltar');
    if (saltar) { saltar.addEventListener('click', terminar); saltar.focus({ preventScroll: true }); }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') terminar(); }, { once: true });
  });

  // Entrada de la portada (Texts reveal de transitions.dev)
  introLista.then(() => {
    document.querySelectorAll('.t-stagger').forEach((bloque) => {
      void bloque.offsetHeight;
      requestAnimationFrame(() => bloque.classList.add('is-shown'));
    });
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

  // Franja de avisos: tocarla (o Enter/espacio) detiene o reanuda el movimiento
  const ventanaAvisos = document.querySelector('.ticker-ventana');
  if (ventanaAvisos) {
    const franja = ventanaAvisos.closest('.anuncio');
    const alternar = () => franja.classList.toggle('pausada');
    ventanaAvisos.addEventListener('click', alternar);
    ventanaAvisos.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); }
    });
  }

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

  // Visor de fotos (Modal de transitions.dev): dentro de cada grupo se avanza con botones o flechas
  const visor = document.querySelector('.visor');
  if (visor) {
    const grande = visor.querySelector('img');
    const marco = visor.querySelector('.t-modal');
    const ms = (v) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(v)) || 0;
    let lista = [];
    let pos = 0;
    const mostrar = (i) => {
      pos = (i + lista.length) % lista.length;
      grande.src = lista[pos].dataset.full;
      grande.alt = lista[pos].querySelector('img').alt;
    };
    const abrir = () => {
      marco.classList.remove('is-closing');
      visor.showModal();
      void marco.offsetWidth;
      marco.classList.add('is-open');
    };
    const cerrar = () => {
      marco.classList.remove('is-open');
      marco.classList.add('is-closing');
      setTimeout(() => { marco.classList.remove('is-closing'); visor.close(); }, ms('--modal-close-dur'));
    };
    document.querySelectorAll('.mini').forEach((b) => b.addEventListener('click', () => {
      lista = [...b.closest('[data-grupo], .rejilla').querySelectorAll('.mini')];
      mostrar(lista.indexOf(b));
      abrir();
    }));
    visor.addEventListener('cancel', (e) => { e.preventDefault(); cerrar(); });
    visor.querySelector('.visor-cerrar').addEventListener('click', cerrar);
    visor.querySelector('.visor-ant').addEventListener('click', () => mostrar(pos - 1));
    visor.querySelector('.visor-sig').addEventListener('click', () => mostrar(pos + 1));
    visor.addEventListener('click', (e) => { if (e.target === visor || e.target.tagName === 'FIGURE') cerrar(); });
    visor.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') mostrar(pos - 1);
      if (e.key === 'ArrowRight') mostrar(pos + 1);
    });
  }

  // Un solo video suena a la vez
  const videos = document.querySelectorAll('video');
  videos.forEach((v) => v.addEventListener('play', () => videos.forEach((o) => { if (o !== v) o.pause(); })));

  // Dibujos que se trazan al entrar en pantalla (mapa de la ruta)
  const trazos = document.querySelectorAll('.traza');
  if (quietos || !('IntersectionObserver' in window)) {
    trazos.forEach((el) => el.classList.add('visto'));
  } else {
    const obsT = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visto'); obsT.unobserve(en.target); } });
    }, { threshold: 0.35 });
    trazos.forEach((el) => obsT.observe(el));
  }

  document.querySelectorAll('.js-anio').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
