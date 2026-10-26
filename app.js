// Browser entry point; features are native ES modules. No build step is required.
import('./frontend/bootstrap.js')
  .then(({ start }) => start())
  .catch((error) => {
    document.querySelector('#backendState').textContent = 'No se pudo iniciar la interfaz';
    console.error(error);
  });
