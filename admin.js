import { auth, db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

let usuarios = [];

const lista = document.getElementById("listaUsuarios");
const modal = document.getElementById("modal");
const formulario = document.getElementById("formUsuario");

const usuariosRef = collection(db, "usuarios");

async function carregarUsuarios() {

    try {

        const consulta = query(
            usuariosRef,
            orderBy("nome")
        );

        const resultado = await getDocs(consulta);

        usuarios = [];

        resultado.forEach((documento) => {

            usuarios.push({
                id: documento.id,
                ...documento.data()
            });

        });

        renderizarUsuarios();

    } catch (erro) {

        console.error("Erro ao carregar usuários:", erro);

        alert(
            "Não foi possível carregar os usuários."
        );
    }
}

function renderizarUsuarios() {

    const busca = document
        .getElementById("busca")
        .value
        .trim()
        .toLowerCase();

    lista.replaceChildren();

    const filtrados = usuarios.filter(usuario =>

        usuario.nome
            .toLowerCase()
            .includes(busca)

        ||

        usuario.email
            .toLowerCase()
            .includes(busca)
    );

    filtrados.forEach(usuario => {

        const linha = document.createElement("tr");

        const iniciais = usuario.nome
            .trim()
            .split(/\s+/)
            .map(palavra => palavra[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

        const nome = document.createElement("td");

        const circulo =
            document.createElement("span");

        circulo.className =
            "usuario-iniciais";

        circulo.textContent =
            iniciais;

        const nomeTexto =
            document.createElement("span");

        nomeTexto.className =
            "usuario-nome";

        nomeTexto.textContent =
            usuario.nome;

        nome.append(circulo, nomeTexto);

        const email =
            document.createElement("td");

        email.textContent =
            usuario.email;

        const perfil =
            document.createElement("td");

        const perfilTag =
            document.createElement("span");

        perfilTag.className = "perfil";

        perfilTag.textContent =
            usuario.perfil;

        perfil.appendChild(perfilTag);

        const status =
            document.createElement("td");

        const statusTag =
            document.createElement("span");

        statusTag.className =
            `status ${usuario.status.toLowerCase()}`;

        statusTag.textContent =
            usuario.status;

        status.appendChild(statusTag);

        const acoes =
            document.createElement("td");

        const editar =
            document.createElement("button");

        editar.className = "acao";

        editar.textContent = "✏️";

        editar.title =
            "Editar usuário";

        editar.onclick = () =>
            editarUsuario(usuario);

        const excluir =
            document.createElement("button");

        excluir.className =
            "acao excluir";

        excluir.textContent = "🗑️";

        excluir.title =
            "Excluir usuário";

        excluir.onclick = () =>
            excluirUsuario(usuario.id);

        acoes.append(
            editar,
            excluir
        );

        linha.append(
            nome,
            email,
            perfil,
            status,
            acoes
        );

        lista.appendChild(linha);
    });

    document.getElementById(
        "mensagemVazia"
    ).style.display =
        filtrados.length === 0
            ? "block"
            : "none";

    atualizarResumo();
}

function atualizarResumo() {

    document.getElementById(
        "totalUsuarios"
    ).textContent =
        usuarios.length;

    document.getElementById(
        "usuariosAtivos"
    ).textContent =
        usuarios.filter(
            usuario =>
                usuario.status === "Ativo"
        ).length;

    document.getElementById(
        "totalAdmins"
    ).textContent =
        usuarios.filter(
            usuario =>
                usuario.perfil ===
                "Administrador"
        ).length;
}

function abrirModal(usuario = null) {

    formulario.reset();

    document.getElementById(
        "usuarioId"
    ).value =
        usuario ? usuario.id : "";

    document.getElementById(
        "tituloModal"
    ).textContent =
        usuario
            ? "Editar usuário"
            : "Novo usuário";

    if (usuario) {

        document.getElementById(
            "nome"
        ).value = usuario.nome;

        document.getElementById(
            "email"
        ).value = usuario.email;

        document.getElementById(
            "perfil"
        ).value = usuario.perfil;

        document.getElementById(
            "status"
        ).value = usuario.status;
    }

    modal.classList.add("aberto");
}

function fecharModal() {

    modal.classList.remove("aberto");
}

async function salvarUsuario(event) {

    event.preventDefault();

    const id =
        document.getElementById(
            "usuarioId"
        ).value;

    const nome =
        document.getElementById(
            "nome"
        ).value.trim();

    const email =
        document.getElementById(
            "email"
        ).value.trim();

    const perfil =
        document.getElementById(
            "perfil"
        ).value;

    const status =
        document.getElementById(
            "status"
        ).value;

    if (!nome || !email) {

        alert(
            "Preencha nome e e-mail."
        );

        return;
    }

    try {

        const dados = {
            nome,
            email,
            perfil,
            status
        };

        if (id) {

            await updateDoc(
                doc(db, "usuarios", id),
                dados
            );

        } else {

            await addDoc(
                usuariosRef,
                dados
            );
        }

        fecharModal();

        await carregarUsuarios();

        alert(
            "Usuário salvo com sucesso!"
        );

    } catch (erro) {

        console.error(erro);

        alert(
            "Erro ao salvar usuário."
        );
    }
}

function editarUsuario(usuario) {

    abrirModal(usuario);
}

async function excluirUsuario(id) {

    const usuario =
        usuarios.find(
            item => item.id === id
        );

    if (!usuario) return;

    const confirmar = confirm(
        `Deseja excluir ${usuario.nome}?`
    );

    if (!confirmar) return;

    try {

        await deleteDoc(
            doc(db, "usuarios", id)
        );

        await carregarUsuarios();

        alert(
            "Usuário excluído."
        );

    } catch (erro) {

        console.error(erro);

        alert(
            "Erro ao excluir usuário."
        );
    }
}

document.getElementById(
    "btnNovo"
).addEventListener(
    "click",
    () => abrirModal()
);

document.getElementById(
    "btnFechar"
).addEventListener(
    "click",
    fecharModal
);

document.getElementById(
    "btnCancelar"
).addEventListener(
    "click",
    fecharModal
);

document.getElementById(
    "busca"
).addEventListener(
    "input",
    renderizarUsuarios
);

formulario.addEventListener(
    "submit",
    salvarUsuario
);

modal.addEventListener(
    "click",
    event => {

        if (event.target === modal) {
            fecharModal();
        }
    }
);

carregarUsuarios();