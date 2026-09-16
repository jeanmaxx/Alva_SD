const labels = {
  dashboard: 'Dashboard',
  clients: 'Clientes / Empresas',
  products: 'Productos y servicios',
  subscriptions: 'Suscripciones / Licencias',
  users: 'Usuarios y accesos',
  billing: 'Cobranza',
  support: 'Soporte',
  settings: 'Configuración'
};

const sidebar = document.querySelector('.sidebar');
const pageTitle = document.querySelector('#page-title');
const navItems = [...document.querySelectorAll('.nav-item')];
const views = [...document.querySelectorAll('.view')];

function openView(id) {
  navItems.forEach(item => item.classList.toggle('active', item.dataset.view === id));
  views.forEach(view => view.classList.toggle('active', view.id === id));
  if (pageTitle) pageTitle.textContent = labels[id] || 'ALVA Admin';
  sidebar?.classList.remove('open');
  history.replaceState(null, '', `#${id}`);
}

navItems.forEach(item => item.addEventListener('click', () => openView(item.dataset.view)));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => openView(button.dataset.go)));
document.querySelector('.sidebar-toggle')?.addEventListener('click', () => sidebar?.classList.toggle('open'));

const initial = location.hash.replace('#', '');
if (labels[initial]) openView(initial);
