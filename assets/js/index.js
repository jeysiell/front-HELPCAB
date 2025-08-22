// =============================
// Ticket System + Auth com Roles
// =============================
class TicketSystem {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.token = null;
  }

  // Buscar todos os tickets
  async fetchTickets() {
    const response = await fetch("http://127.0.0.1:5000/api/tickets", {
      headers: this._authHeader(),
    });
    if (!response.ok) throw new Error("Erro ao buscar chamados");
    const tickets = await response.json();

    const ticketsWithComments = await Promise.all(
      tickets.map(async (ticket) => {
        const comments = await this.fetchComments(ticket.id);
        return { ...ticket, comentarios: comments };
      })
    );

    return ticketsWithComments;
  }

  async fetchComments(ticketId) {
    const response = await fetch(
      `http://127.0.0.1:5000/api/tickets/${ticketId}/comentarios`,
      { headers: this._authHeader() }
    );
    if (!response.ok) return [];
    return await response.json();
  }

  async getTickets() {
    return await this.fetchTickets();
  }

  async addTicket(ticketData) {
    const response = await fetch("http://127.0.0.1:5000/api/tickets", {
      method: "POST",
      headers: { ...this._authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ ...ticketData, solicitante: this.currentUser }),
    });
    if (!response.ok) throw new Error("Erro ao criar chamado");
    const ticket = await response.json();
    ticket.comentarios = [];
    return ticket;
  }

  async updateTicketStatus(id, status, responsavel = "") {
    const response = await fetch(`http://127.0.0.1:5000/api/tickets/${id}`, {
      method: "PATCH",
      headers: { ...this._authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ status, tecnicoResponsavel: responsavel }),
    });
    if (!response.ok) throw new Error("Erro ao atualizar status do chamado");
    return await response.json();
  }

  async addComment(ticketId, comment) {
    const response = await fetch(
      `http://127.0.0.1:5000/api/tickets/${ticketId}/comentarios`,
      {
        method: "POST",
        headers: { ...this._authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ autor: this.currentUser, texto: comment }),
      }
    );
    if (!response.ok) throw new Error("Erro ao adicionar comentário");
    return await response.json();
  }

  async getStats() {
    const tickets = await this.fetchTickets();
    const total = tickets.length;
    const aberto = tickets.filter((t) => t.status === "Aberto").length;
    const andamento = tickets.filter((t) => t.status === "Em Andamento").length;
    const resolvido = tickets.filter((t) => t.status === "Resolvido").length;
    const fechado = tickets.filter((t) => t.status === "Fechado").length;
    return { total, aberto, andamento, resolvido, fechado };
  }

  async getCategoryStats() {
    const tickets = await this.fetchTickets();
    const categories = {};
    tickets.forEach((t) => {
      categories[t.categoria] = (categories[t.categoria] || 0) + 1;
    });
    return categories;
  }

  async getPriorityStats() {
    const tickets = await this.fetchTickets();
  }
}

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  authenticate(username, password);
});

const users = [
  { username: "admin", password: "admin123", role: "administrador" },
  { username: "tecnico", password: "tecnico123", role: "tecnico" },
  { username: "dev", password: "dev123", role: "desenvolvedor" },
];

function authenticate(username, password) {
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    ticketSystem.currentUser = user.username;
    ticketSystem.userRole = user.role; // Armazena o papel do usuário
    showNotification(`Bem-vindo, ${user.username}!`, "success");
    loadDashboard(); // Carrega o dashboard após login
  } else {
    showNotification("Usuário ou senha inválidos", "error");
  }
}

// Navegação
function showSection(sectionName, event = null) {
  // Esconder todas as seções
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.add("hidden");
  });

  // Mostrar seção selecionada
  document.getElementById(sectionName + "-section").classList.remove("hidden");

  // Verificar permissões
  if (ticketSystem.userRole === "administrador") {
    // Permissões para administrador
  } else if (ticketSystem.userRole === "tecnico") {
    // Permissões para técnico
  } else if (ticketSystem.userRole === "desenvolvedor") {
    // Permissões para desenvolvedor
  }

  // Atualizar título e navegação ativa
  const titles = {
    dashboard: "Dashboard",
    "novo-chamado": "Novo Chamado",
    "meus-chamados": "Meus Chamados",
    "todos-chamados": "Todos os Chamados",
    relatorios: "Relatórios",
    "base-conhecimento": "Base de Conhecimento",
    configuracoes: "Configurações",
  };
  document.getElementById("page-title").textContent = titles[sectionName];

  // Atualizar navegação ativa
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("bg-blue-50", "text-blue-600");
  });
  if (event) {
    const navItem = event.target.closest(".nav-item");
    if (navItem) {
      navItem.classList.add("bg-blue-50", "text-blue-600");
    }
  }

  // Carregar dados da seção
  loadSectionData(sectionName);

  // Fechar menu mobile
  if (window.innerWidth < 1024) {
    toggleMobileMenu(false);
  }
}

// Carregar dados por seção
function loadSectionData(sectionName) {
  switch (sectionName) {
    case "dashboard":
      loadDashboard();
      break;
    case "meus-chamados":
      loadMeusChamados();
      break;
    case "todos-chamados":
      loadTodosChamados();
      break;
  }
}

// Dashboard
async function loadDashboard() {
  try {
    const stats = await ticketSystem.getStats();

    // Atualizar cards de estatísticas
    document.getElementById("total-chamados").textContent = stats.total;
    document.getElementById("chamados-aberto").textContent = stats.aberto;
    document.getElementById("chamados-andamento").textContent = stats.andamento;
    document.getElementById("chamados-resolvido").textContent = stats.resolvido;

    // Atualizar o número de chamados em aberto
    document.getElementById("chamados-em-aberto").textContent = stats.aberto;

    // Gráfico de categorias
    loadCategoryChart();

    // Gráfico de prioridades
    loadPriorityChart();

    // Chamados recentes
    loadRecentTickets();
  } catch (error) {
    console.error(error);
    showNotification("Erro ao carregar dados do dashboard", "error");
  }
}

function loadCategoryChart() {
  const categories = ticketSystem.getCategoryStats();
  const total = Object.values(categories).reduce(
    (sum, count) => sum + count,
    0
  );
  const chartContainer = document.getElementById("category-chart");

  chartContainer.innerHTML = Object.entries(categories)
    .map(([category, count]) => {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return `
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-600">${category}</span>
                        <span class="text-sm font-medium">${count}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div class="bg-blue-600 h-2 rounded-full chart-bar" style="width: ${percentage}%"></div>
                    </div>
                `;
    })
    .join("");
}

function loadPriorityChart() {
  const priorities = ticketSystem.getPriorityStats();
  const total = Object.values(priorities).reduce(
    (sum, count) => sum + count,
    0
  );
  const chartContainer = document.getElementById("priority-chart");
  const colors = {
    Alta: "bg-red-500",
    Media: "bg-yellow-500",
    Baixa: "bg-green-500",
  };

  chartContainer.innerHTML = Object.entries(priorities)
    .map(([priority, count]) => {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return `
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-600">${priority}</span>
                        <span class="text-sm font-medium">${count}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div class="${colors[priority]} h-2 rounded-full chart-bar" style="width: ${percentage}%"></div>
                    </div>
                `;
    })
    .join("");
}

async function loadRecentTickets() {
  const tickets = await ticketSystem.getTickets();
  const recentTickets = tickets.slice(0, 5);
  const container = document.getElementById("recent-tickets");

  container.innerHTML = recentTickets
    .map(
      (ticket) => `
        <div class="p-4 hover:bg-gray-50 cursor-pointer priority-${ticket.prioridade.toLowerCase()}" onclick="viewTicket(${
        ticket.id
      })">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">#${ticket.id} - ${
        ticket.titulo
      }</h4>
              <div class="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span><i class="fas fa-user mr-1"></i>${
                  ticket.solicitante
                }</span>
                <span><i class="fas fa-tag mr-1"></i>${ticket.categoria}</span>
                <span><i class="fas fa-clock mr-1"></i>${formatRelativeTime(
                  ticket.dataAbertura
                )}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${ticket.status
                .toLowerCase()
                .replace(" ", "-")}">${ticket.status}</span>
              <div class="text-xs text-gray-500 mt-1">${ticket.prioridade}</div>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

// Novo Chamado
document
  .getElementById("novo-chamado-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      titulo: document.getElementById("titulo").value,
      categoria: document.getElementById("categoria").value,
      prioridade: document.getElementById("prioridade").value,
      departamento: document.getElementById("departamento").value,
      descricao: document.getElementById("descricao").value,
    };

    try {
      const ticket = await ticketSystem.addTicket(formData);
      showNotification(
        "Chamado #" + ticket.id + " criado com sucesso!",
        "success"
      );
      resetForm();
      showSection("meus-chamados");
    } catch (error) {
      console.error(error);
      showNotification("Erro ao criar chamado", "error");
    }
  });

function resetForm() {
  document.getElementById("novo-chamado-form").reset();
  document.getElementById("file-list").innerHTML = "";
}

// Upload de arquivos
document.getElementById("anexos").addEventListener("change", function (e) {
  const fileList = document.getElementById("file-list");
  fileList.innerHTML = "";

  Array.from(e.target.files).forEach((file) => {
    const div = document.createElement("div");
    div.className =
      "flex items-center justify-between bg-gray-100 p-2 rounded mt-2";
    div.innerHTML = `
                    <span class="text-sm">${file.name}</span>
                    <span class="text-xs text-gray-500">${(
                      file.size /
                      1024 /
                      1024
                    ).toFixed(2)} MB</span>
                `;
    fileList.appendChild(div);
  });
});

// Meus Chamados
async function loadMeusChamados() {
  try {
    const tickets = await ticketSystem.fetchTickets();
    const userTickets = tickets.filter(
      (ticket) => ticket.solicitante === ticketSystem.currentUser
    );
    renderTicketList("meus-chamados-list", userTickets);
  } catch (error) {
    console.error(error);
    showNotification("Erro ao carregar meus chamados", "error");
  }
}

// Todos os Chamados
async function loadTodosChamados() {
  try {
    const tickets = await ticketSystem.fetchTickets();
    renderTicketList("todos-chamados-list", tickets, true);
  } catch (error) {
    console.error(error);
    showNotification("Erro ao carregar todos os chamados", "error");
  }
}

// Renderizar lista de chamados
function renderTicketList(containerId, tickets, showActions = false) {
  const container = document.getElementById(containerId);

  if (tickets.length === 0) {
    container.innerHTML = `
                    <div class="p-8 text-center text-gray-500">
                        <i class="fas fa-ticket-alt text-4xl mb-4"></i>
                        <p>Nenhum chamado encontrado</p>
                    </div>
                `;
    return;
  }

  container.innerHTML = tickets
    .map(
      (ticket) => `
                <div class="p-6 border-b border-gray-200 hover:bg-gray-50 priority-${ticket.prioridade.toLowerCase()}" onclick="viewTicket(${
        ticket.id
      })">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <h4 class="text-lg font-medium text-gray-900 mr-3">#${
                                  ticket.id
                                } - ${ticket.titulo}</h4>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${ticket.status
                                  .toLowerCase()
                                  .replace(" ", "-")}">${ticket.status}</span>
                            </div>
                            <p class="text-gray-600 mb-3">${ticket.descricao.substring(
                              0,
                              150
                            )}${ticket.descricao.length > 150 ? "..." : ""}</p>
                            <div class="flex items-center space-x-6 text-sm text-gray-500">
                                <span><i class="fas fa-user mr-1"></i>${
                                  ticket.solicitante
                                }</span>
                                <span><i class="fas fa-tag mr-1"></i>${
                                  ticket.categoria
                                }</span>
                                <span><i class="fas fa-building mr-1"></i>${
                                  ticket.departamento
                                }</span>
                                <span><i class="fas fa-clock mr-1"></i>${formatRelativeTime(
                                  ticket.dataAbertura
                                )}</span>
                                ${
                                  ticket.tecnicoResponsavel
                                    ? `<span><i class="fas fa-user-cog mr-1"></i>${ticket.tecnicoResponsavel}</span>`
                                    : ""
                                }
                            </div>
                        </div>
                        <div class="flex flex-col items-end">
                            <div class="priority-badge mb-2">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(
                                  ticket.prioridade
                                )}">
                                    ${ticket.prioridade}
                                </span>
                            </div>
                            ${
                              showActions
                                ? `
                                <div class="flex space-x-2">
                                    ${
                                      ticket.status === "Aberto"
                                        ? `<button onclick="updateTicketStatus(${ticket.id}, 'Em Andamento', 'Técnico João'); event.stopPropagation();" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Assumir</button>`
                                        : ""
                                    }
                                    ${
                                      ticket.status === "Em Andamento"
                                        ? `<button onclick="updateTicketStatus(${ticket.id}, 'Resolvido'); event.stopPropagation();" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Resolver</button>`
                                        : ""
                                    }
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                </div>
            `
    )
    .join("");
}

// Visualizar chamado
async function viewTicket(ticketId) {
  const tickets = await ticketSystem.getTickets(); // busca os chamados
  const ticket = tickets.find((t) => t.id === ticketId); // procura pelo ID
  if (!ticket) return;

  document.getElementById(
    "modal-title"
  ).textContent = `Chamado #${ticket.id} - ${ticket.titulo}`;
  document.getElementById("modal-content").innerHTML = `
    <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 class="font-medium text-gray-900 mb-3">Informações do Chamado</h4>
                <div class="space-y-2 text-sm">
                    <div><strong>Status:</strong> <span class="status-${ticket.status
                      .toLowerCase()
                      .replace(" ", "-")} px-2 py-1 rounded">${
    ticket.status
  }</span></div>
                    <div><strong>Prioridade:</strong> <span class="${getPriorityClass(
                      ticket.prioridade
                    )} px-2 py-1 rounded">${ticket.prioridade}</span></div>
                    <div><strong>Categoria:</strong> ${ticket.categoria}</div>
                    <div><strong>Departamento:</strong> ${
                      ticket.departamento
                    }</div>
                    <div><strong>Solicitante:</strong> ${
                      ticket.solicitante
                    }</div>
                    ${
                      ticket.tecnicoResponsavel
                        ? `<div><strong>Técnico:</strong> ${ticket.tecnicoResponsavel}</div>`
                        : ""
                    }
                </div>
            </div>
            <div>
                <h4 class="font-medium text-gray-900 mb-3">Datas</h4>
                <div class="space-y-2 text-sm">
                    <div><strong>Abertura:</strong> ${formatDateTime(
                      ticket.dataAbertura
                    )}</div>
                    <div><strong>Última atualização:</strong> ${formatDateTime(
                      ticket.dataAtualizacao
                    )}</div>
                </div>
            </div>
        </div>
        
        <div>
            <h4 class="font-medium text-gray-900 mb-3">Descrição</h4>
            <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-gray-700 whitespace-pre-wrap">${
                  ticket.descricao
                }</p>
            </div>
        </div>
        
        ${
          ticket.comentarios.length > 0
            ? `
            <div>
                <h4 class="font-medium text-gray-900 mb-3">Comentários</h4>
                <div class="space-y-3">
                    ${ticket.comentarios
                      .map(
                        (comment) => `
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-medium text-gray-900">${
                                  comment.autor
                                }</span>
                                <span class="text-sm text-gray-500">${formatDateTime(
                                  comment.data
                                )}</span>
                            </div>
                            <p class="text-gray-700">${comment.texto}</p>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `
            : ""
        }
        
        <div>
            <h4 class="font-medium text-gray-900 mb-3">Adicionar Comentário</h4>
            <form onsubmit="addComment(event, ${
              ticket.id
            })" class="flex space-x-2">
                <input type="text" id="comment-input-${
                  ticket.id
                }" class="flex-1 p-2 border border-gray-300 rounded-lg" placeholder="Digite seu comentário..." required>
                <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    </div>
  `;
  document.getElementById("ticket-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("ticket-modal").classList.add("hidden");
}

async function addComment(event, ticketId) {
  event.preventDefault();
  const input = document.getElementById(`comment-input-${ticketId}`);
  if (input.value.trim()) {
    try {
      await ticketSystem.addComment(ticketId, input.value.trim());
      viewTicket(ticketId);
      showNotification("Comentário adicionado!", "success");
    } catch (error) {
      console.error(error);
      showNotification("Erro ao adicionar comentário", "error");
    }
  }
}

async function updateTicketStatus(id, status, responsavel = "") {
  try {
    await ticketSystem.updateTicketStatus(id, status, responsavel);
    await loadTodosChamados();
    await loadDashboard();
    showNotification("Status do chamado atualizado!", "success");
  } catch (error) {
    console.error(error);
    showNotification("Erro ao atualizar status do chamado", "error");
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case "Alta":
      return "bg-red-100 text-red-800";
    case "Media":
      return "bg-yellow-100 text-yellow-800";
    case "Baixa":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("pt-BR");
}

function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return date.toLocaleDateString("pt-BR");
}

// Notificações
function showNotification(message, type = "info") {
  const container = document.getElementById("notifications");
  const notification = document.createElement("div");
  const colors = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };
  notification.className = `notification px-4 py-3 rounded shadow ${
    colors[type] || colors.info
  }`;
  notification.textContent = message;
  container.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Mobile menu
function toggleMobileMenu(show = null) {
  const sidebar = document.getElementById("sidebar");
  if (show === null) {
    sidebar.classList.toggle("-translate-x-full");
  } else if (show) {
    sidebar.classList.remove("-translate-x-full");
  } else {
    sidebar.classList.add("-translate-x-full");
  }
}
document
  .getElementById("mobile-menu-btn")
  .addEventListener("click", () => toggleMobileMenu());

// Filtros
document.getElementById("filter-status")?.addEventListener("change", () => {
  if (
    !document
      .getElementById("meus-chamados-section")
      .classList.contains("hidden")
  )
    loadMeusChamados();
  if (
    !document
      .getElementById("todos-chamados-section")
      .classList.contains("hidden")
  )
    loadTodosChamados();
});
document
  .getElementById("filter-priority")
  ?.addEventListener("change", loadMeusChamados);
document
  .getElementById("filter-category")
  ?.addEventListener("change", loadTodosChamados);
document
  .getElementById("search-tickets")
  ?.addEventListener("input", loadTodosChamados);

// Logout
function logout() {
  ticketSystem.currentUser = "";
  ticketSystem.userRole = "";
  showNotification("Logout realizado!", "success");
  showSection("login"); // Redireciona para a tela de login
}


// Inicialização
const saved = JSON.parse(localStorage.getItem("session"));
if (saved) {
ticketSystem.currentUser = saved.user;
ticketSystem.userRole = saved.role;
updateSidebar();
showSection("dashboard");
loadDashboard();
} else {
showSection("login");
}