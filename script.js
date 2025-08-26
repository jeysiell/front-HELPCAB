// API Configuration
const API_BASE_URL = "https://helpcab.onrender.com/api";

// Global State
let currentUser = null;
let currentTicketId = null;

// DOM Elements
const loginScreen = document.getElementById("loginScreen");
const registerScreen = document.getElementById("registerScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const loadingSpinner = document.getElementById("loadingSpinner");
const toastContainer = document.getElementById("toastContainer");

// Navigation
const navItems = document.querySelectorAll(".nav-item");
const contentSections = document.querySelectorAll(".content-section");

// Tickets
const ticketsList = document.getElementById("ticketsList");
const refreshTicketsBtn = document.getElementById("refreshTickets");
const newTicketForm = document.getElementById("newTicketForm");

// Modal
const ticketModal = document.getElementById("ticketModal");
const modalClose = document.querySelector(".modal-close");
const ticketDetails = document.getElementById("ticketDetails");
const statusUpdate = document.getElementById("statusUpdate");
const updateStatusBtn = document.getElementById("updateStatus");
const commentsList = document.getElementById("commentsList");
const commentForm = document.getElementById("commentForm");

// Utility Functions
function showLoading() {
  loadingSpinner.classList.add("active");
}

function hideLoading() {
  loadingSpinner.classList.remove("active");
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

function showScreen(screenName) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  document.getElementById(screenName + "Screen").classList.add("active");
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("pt-BR");
}

function getPriorityClass(priority) {
  return `priority-${priority}`;
}

function getStatusClass(status) {
  return `status-${status}`;
}

// API Functions
async function apiRequest(endpoint, options = {}) {
  showLoading();

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro na requisição");
    }

    return data;
  } catch (error) {
    showToast(error.message, "error");
    throw error;
  } finally {
    hideLoading();
  }
}

// Authentication Functions
async function login(email, senha) {
  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });

    currentUser = response.usuario;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    showDashboard();
    showToast("Login realizado com sucesso!", "success");
  } catch (error) {
    console.error("Erro no login:", error);
  }
}

async function register(nome, email, senha, cargo) {
  try {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ nome, email, senha, cargo }),
    });

    showToast(
      "Cadastro realizado com sucesso! Faça login para continuar.",
      "success"
    );
    showScreen("login");
  } catch (error) {
    console.error("Erro no cadastro:", error);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  showScreen("login");
  showToast("Logout realizado com sucesso!", "success");
}

// Ticket Functions
async function loadTickets() {
  try {
    const tickets = await apiRequest("/tickets");
    displayTickets(tickets);
  } catch (error) {
    console.error("Erro ao carregar chamados:", error);
  }
}

function displayTickets(tickets) {
  ticketsList.innerHTML = "";

  if (tickets.length === 0) {
    ticketsList.innerHTML =
      '<div class="no-tickets">Nenhum chamado encontrado</div>';
    return;
  }

  tickets.forEach((ticket) => {
    const ticketElement = document.createElement("div");
    ticketElement.className = "ticket-item";
    ticketElement.onclick = () => openTicketModal(ticket.id);

    ticketElement.innerHTML = `
            <div class="ticket-header">
                <div>
                    <div class="ticket-title">${ticket.titulo}</div>
                    <div class="ticket-meta">
                        <span>ID: #${ticket.id}</span>
                        <span>Solicitante: ${ticket.solicitante}</span>
                        <span>Departamento: ${ticket.departamento}</span>
                        <span>Criado: ${formatDate(ticket.dataAbertura)}</span>
                    </div>
                </div>
                <div>
                    <span class="ticket-status ${getStatusClass(
                      ticket.status
                    )}">${ticket.status}</span>
                    <span class="priority-badge ${getPriorityClass(
                      ticket.prioridade
                    )}">${ticket.prioridade}</span>
                </div>
            </div>
        `;

    ticketsList.appendChild(ticketElement);
  });
}

async function createTicket(ticketData) {
  try {
    const response = await apiRequest("/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    });

    // 🔥 Pegar o protocolo retornado pela API
    const protocolo = response?.ticket?.protocolo;

    if (protocolo) {
      showToast(
        `Chamado criado com sucesso! Protocolo: ${protocolo}`,
        "success"
      );
    } else {
      showToast("Chamado criado com sucesso!", "success");
    }

    newTicketForm.reset();
    loadTickets();
    showSection("tickets");
  } catch (error) {
    console.error("Erro ao criar chamado:", error);
    showToast("Erro ao criar chamado!", "error");
  }
}

async function updateTicketStatus(ticketId, status, tecnicoResponsavel) {
  try {
    await apiRequest(`/tickets/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, tecnicoResponsavel }),
    });

    showToast("Status atualizado com sucesso!", "success");
    loadTickets();
    openTicketModal(ticketId); // Refresh modal
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
  }
}

// Modal Functions
async function openTicketModal(ticketId) {
  currentTicketId = ticketId;

  try {
    // Load ticket details
    const tickets = await apiRequest("/tickets");
    const ticket = tickets.find((t) => t.id === ticketId);

    if (!ticket) {
      showToast("Chamado não encontrado", "error");
      return;
    }

    // Display ticket details
    // Display ticket details
    ticketDetails.innerHTML = `
  <div class="detail-row">
      <span class="detail-label">ID:</span>
      <span class="detail-value">#${ticket.id}</span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Título:</span>
      <span class="detail-value">${ticket.titulo}</span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Categoria:</span>
      <span class="detail-value">${ticket.categoria}</span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Prioridade:</span>
      <span class="detail-value priority-badge ${getPriorityClass(
        ticket.prioridade
      )}">
        ${ticket.prioridade}
      </span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Status:</span>
      <span class="detail-value ticket-status ${getStatusClass(ticket.status)}">
        ${ticket.status}
      </span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Departamento:</span>
      <span class="detail-value">${ticket.departamento}</span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Setor:</span>
      <span class="detail-value">${ticket.setor}</span>
  </div>
  ${
    ticket.detalheSetor
      ? `
      <div class="detail-row">
        <span class="detail-label">Detalhe do Setor:</span>
        <span class="detail-value">${ticket.detalheSetor}</span>
      </div>
      `
      : ""
  }
  <div class="detail-row">
      <span class="detail-label">Solicitante:</span>
      <span class="detail-value">${ticket.solicitante}</span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Técnico:</span>
      <span class="detail-value">${
        ticket.tecnicoResponsavel || "Não atribuído"
      }</span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Criado:</span>
      <span class="detail-value">${formatDate(ticket.dataAbertura)}</span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Atualizado:</span>
      <span class="detail-value">${
        ticket.dataAtualizacao ? formatDate(ticket.dataAtualizacao) : "Nunca"
      }</span>
  </div>
  <div class="detail-row">
      <span class="detail-label">Descrição:</span>
      <span class="detail-value">${ticket.descricao}</span>
  </div>
`;

    // Set current values in status update form
    document.getElementById("newStatus").value = ticket.status;
    document.getElementById("tecnicoResponsavel").value =
      ticket.tecnicoResponsavel || "";

    // Load comments
    loadComments(ticketId);

    // Show modal
    ticketModal.classList.add("active");
  } catch (error) {
    console.error("Erro ao carregar detalhes do chamado:", error);
  }
}

function closeTicketModal() {
  ticketModal.classList.remove("active");
  currentTicketId = null;
}

// Comments Functions
async function loadComments(ticketId) {
  try {
    const comments = await apiRequest(`/tickets/${ticketId}/comentarios`);
    displayComments(comments);
  } catch (error) {
    console.error("Erro ao carregar comentários:", error);
    commentsList.innerHTML = "<div>Erro ao carregar comentários</div>";
  }
}

function displayComments(comments) {
  commentsList.innerHTML = "";

  if (comments.length === 0) {
    commentsList.innerHTML = "<div>Nenhum comentário encontrado</div>";
    return;
  }

  comments.forEach((comment) => {
    const commentElement = document.createElement("div");
    commentElement.className = "comment-item";

    commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.autor}</span>
                <span class="comment-date">${formatDate(comment.data)}</span>
            </div>
            <div class="comment-text">${comment.texto}</div>
        `;

    commentsList.appendChild(commentElement);
  });
}

async function addComment(ticketId, autor, texto) {
  try {
    await apiRequest(`/tickets/${ticketId}/comentarios`, {
      method: "POST",
      body: JSON.stringify({ autor, texto }),
    });

    showToast("Comentário adicionado com sucesso!", "success");
    commentForm.reset();
    loadComments(ticketId);
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
  }
}

// Navigation Functions
function showSection(sectionName) {
  // Update navigation
  navItems.forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.section === sectionName) {
      item.classList.add("active");
    }
  });

  // Update content sections
  contentSections.forEach((section) => {
    section.classList.remove("active");
  });

  document.getElementById(sectionName + "Section").classList.add("active");
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Check for saved user
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showDashboard();
  } else {
    showScreen("login");
  }

  // Login/Register Forms
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    login(formData.get("email"), formData.get("senha"));
  });

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    register(
      formData.get("nome"),
      formData.get("email"),
      formData.get("senha"),
      formData.get("cargo")
    );
  });

  showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    showScreen("register");
  });

  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    showScreen("login");
  });

  logoutBtn.addEventListener("click", logout);

  // Navigation
  navItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      showSection(this.dataset.section);
    });
  });

  // Tickets
  refreshTicketsBtn.addEventListener("click", loadTickets);

  newTicketForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const ticketData = {
      titulo: formData.get("titulo"),
      categoria: formData.get("categoria"),
      prioridade: formData.get("prioridade"),
      departamento: formData.get("departamento"),
      setor: formData.get("setor"),
      detalheSetor: formData.get("detalheSetor") || null, // ⚡ nome correto
      descricao: formData.get("descricao"),
      solicitante: formData.get("solicitante"),
    };

    createTicket(ticketData);
  });

  // Modal
  modalClose.addEventListener("click", closeTicketModal);

  ticketModal.addEventListener("click", (e) => {
    if (e.target === ticketModal) {
      closeTicketModal();
    }
  });

  updateStatusBtn.addEventListener("click", () => {
    if (!currentTicketId) return;

    let status = document.getElementById("newStatus").value;
    const tecnico = document.getElementById("tecnicoResponsavel").value;

    // Normaliza os valores para o banco
    switch (status) {
      case "aberto":
        status = "Aberto";
        break;
      case "Em_andamento":
        status = "Em andamento";
        break;
      case "resolvido":
        status = "Resolvido";
        break;
      case "fechado":
        status = "Fechado";
        break;
    }

    updateTicketStatus(currentTicketId, status, tecnico);
  });

  // Comments
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentTicketId) return;

    const formData = new FormData(e.target);
    addComment(currentTicketId, formData.get("autor"), formData.get("texto"));
  });
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && ticketModal.classList.contains("active")) {
    closeTicketModal();
  }
});

const setorSelect = document.getElementById("setor");
const detalheContainer = document.getElementById("setorDetalheContainer");

setorSelect.addEventListener("change", () => {
  detalheContainer.innerHTML = ""; // limpa campos antigos
  const setor = setorSelect.value;

  if (setor === "salas") {
    detalheContainer.innerHTML = `
      <label for="numeroSala">Número da Sala:</label>
      <input type="text" id="numeroSala" name="detalheSetor" required class="w-full p-2 border rounded">
    `;
  } else if (setor === "coordenacao") {
    detalheContainer.innerHTML = `
      <label for="tipoCoordenacao">Tipo de Coordenação:</label>
      <select id="tipoCoordenacao" name="detalheSetor" required class="w-full p-2 border rounded">
        <option value="pedagogica">Pedagógica</option>
        <option value="orientacao">Orientação</option>
        <option value="administrativa">Administrativa</option>
        <option value="outra">Outra</option>
      </select>
    `;
  }
  // admin e outros não precisam de campo extra
});
// Elementos do DOM
const tecnicosList = document.getElementById("tecnicosList");
const setorTecnicoForm = document.getElementById("setorTecnicoForm");
const setorSelectfor = document.getElementById("setorSelectfor");
const tecnicoInput = document.getElementById("tecnicoInput");

// Função para carregar técnicos
async function loadTecnicos() {
  if (!tecnicosList) return; // evita erro se elemento não existir

  try {
    const response = await fetch(`${API_BASE_URL}/auth/setores-tecnicos`);
    const data = await response.json();

    tecnicosList.innerHTML = data
      .map(
        (item) => `
      <div class="p-2 border rounded mb-2 flex justify-between items-center">
        <span><strong>${item.setor}:</strong> ${item.tecnico}</span>
      </div>
    `
      )
      .join("");
  } catch (err) {
    tecnicosList.innerHTML = "<div>Erro ao carregar técnicos</div>";
    console.error(err);
  }
}

// Salvar técnico (apenas se o formulário existir)
if (setorTecnicoForm && setorSelectfor && tecnicoInput) {
  setorTecnicoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const setor = setorSelectfor.value;
    const tecnico = tecnicoInput.value;

    if (!setor || !tecnico) {
      showToast("Preencha todos os campos", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/setor-tecnico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setor, tecnico }),
      });

      const result = await response.json();
      showToast(result.message || "Técnico salvo com sucesso", "success");
      setorTecnicoForm.reset();
      loadTecnicos(); // atualiza lista
    } catch (err) {
      showToast("Erro ao salvar técnico", "error");
      console.error(err);
    }
  });
}

// Carrega ao abrir a seção (apenas se admin)
document.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser); // usa a variável global
    if (currentUser.cargo === "admin") {
      loadTecnicos();
    }
    showDashboard(); // já mostra o dashboard se usuário logado
  }
});

function showDashboard() {
  showScreen("dashboard");
  userInfo.textContent = `${currentUser.nome} (${currentUser.cargo})`;

  // Atualiza menu lateral
  function updateAdminNav() {
    const adminNavContainer = document.getElementById("adminNavContainer");
    adminNavContainer.innerHTML = "";

    if (currentUser && currentUser.cargo === "admin") {
      const adminLink = document.createElement("a");
      adminLink.href = "#";
      adminLink.className = "nav-item";
      adminLink.dataset.section = "adminSetores";
      adminLink.innerHTML = `<i class="fas fa-cogs"></i> Admin Setores`;

      adminLink.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("adminSetores"); // ativa a section correta
      });

      adminNavContainer.appendChild(adminLink);
    }
  }

  updateAdminNav();

  // ❌ Não chame loadTickets() aqui sem checagem
  if (currentUser.cargo === "tecnico") {
    loadTicketsByTecnico(currentUser.nome);
  } else {
    loadTickets(); // Admin ou outros cargos veem todos
  }

  // Esconde a section admin se não for admin
  const adminSection = document.getElementById("adminSetoresSection");
  if (currentUser.cargo !== "admin") {
    adminSection.classList.remove("active"); // não aparece
  }
}

async function loadTecnicos() {
  if (!tecnicosList || !tecnicoInput) return; // evita erro se elementos não existirem

  try {
    // Pega técnicos já atribuídos a setores
    const response = await fetch(`${API_BASE_URL}/auth/setores-tecnicos`);
    const data = await response.json();

    // Lista na seção de técnicos por setor
    tecnicosList.innerHTML = data
      .map(
        (item) => `
        <div class="p-2 border rounded mb-2 flex justify-between items-center">
            <span><strong>${item.setor}:</strong> ${item.tecnico}</span>
        </div>
    `
      )
      .join("");

    // Carrega todos os usuários com cargo técnico no select
    const usersResponse = await fetch(
      `${API_BASE_URL}/auth/usuarios?cargo=tecnico`
    );
    const usersData = await usersResponse.json();

    tecnicoInput.innerHTML = '<option value="">Selecione o técnico</option>'; // limpa
    usersData.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.nome;
      option.textContent = user.nome;
      tecnicoInput.appendChild(option);
    });
  } catch (err) {
    tecnicosList.innerHTML = "<div>Erro ao carregar técnicos</div>";
    console.error(err);
  }
}

async function loadTicketsByTecnico(tecnicoNome) {
  try {
    const tickets = await apiRequest(
      `/tickets/tecnico/${encodeURIComponent(tecnicoNome)}`
    );
    displayTickets(tickets); // Reutiliza a mesma função de exibição
  } catch (error) {
    console.error("Erro ao carregar chamados do técnico:", error);
  }
}


