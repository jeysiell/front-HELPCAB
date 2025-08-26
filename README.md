# API front end

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/gambiarras13feliz-7065s-projects/v0-api-front-end)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/UsLfncxxi6b)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/gambiarras13feliz-7065s-projects/v0-api-front-end](https://vercel.com/gambiarras13feliz-7065s-projects/v0-api-front-end)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/UsLfncxxi6b](https://v0.app/chat/projects/UsLfncxxi6b)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository



    <!-- Admin Setores Section -->
    <section id="adminSetoresSection" class="max-w-3xl mx-auto mt-12 px-6">
        <header class="mb-8 text-center">
            <h2 class="text-3xl font-semibold text-gray-800">Configuração de Técnicos por Setor</h2>
            <p class="text-gray-500 mt-2">Gerencie os técnicos responsáveis por cada setor de forma simples.</p>
        </header>

        <div class="space-y-8">
            <div id="tecnicosList" class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <div class="grid grid-cols-1 gap-4">
                    <div class="card bg-gray-100 border border-gray-300 rounded-lg p-4 flex justify-between items-center" data-setor="salas">
                        <div>
                            <h3 class="text-lg font-semibold">Salas de Aula</h3>
                            <p class="text-gray-600">Técnico: <span class="tecnico-nome">Nenhum técnico atribuído</span></p>
                        </div>
                        <button class="btn-select-tecnico bg-blue-500 text-white rounded px-4 py-2">Selecionar Técnico</button>
                    </div>
                    <div class="card bg-gray-100 border border-gray-300 rounded-lg p-4 flex justify-between items-center" data-setor="coordenacao">
                        <div>
                            <h3 class="text-lg font-semibold">Coordenação</h3>
                            <p class="text-gray-600">Técnico: <span class="tecnico-nome">Nenhum técnico atribuído</span></p>
                        </div>
                        <button class="btn-select-tecnico bg-blue-500 text-white rounded px-4 py-2">Selecionar Técnico</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal para seleção de técnico -->
        <dialog id="modalSelecionarTecnico" class="rounded-lg p-4">
            <div class="dlg">
                <h2 class="text-lg font-semibold">Selecionar Técnico</h2>
                <select id="modalTecnicoSelect" class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    <option value="">Selecione o técnico</option>
                    <option value="tecnico1">Técnico 1</option>
                    <option value="tecnico2">Técnico 2</option>
                    <option value="tecnico3">Técnico 3</option>
                </select>
                <div class="mt-4">
                    <button id="btnSalvarTecnico" class="bg-blue-600 text-white rounded px-4 py-2">Salvar</button>
                    <button id="btnRemoverTecnico" class="bg-red-600 text-white rounded px-4 py-2">Remover Técnico</button>
                    <button id="btnFecharModal" class="bg-gray-300 text-gray-700 rounded px-4 py-2">Fechar</button>
                </div>
            </div>
        </dialog>
    </section>

