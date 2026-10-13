
import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const mensagem = document.getElementById("mensagem");
const botao = document.getElementById("btnLogin");

form.addEventListener("submit", async (event) => {
    console.log("Formulário de login iniciado.");
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const senha = senhaInput.value;

    mensagem.textContent = "";
    botao.disabled = true;
    botao.textContent = "Entrando...";

    let usuarioAutenticado = false;

    try {
        // 1. Autenticar no Firebase Authentication
        const resultado = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        usuarioAutenticado = true;

        const usuario = resultado.user;
        const emailAutenticado = usuario.email
            ?.trim()
            .toLowerCase();

        console.log("Login realizado:", emailAutenticado);
        console.log("Projeto Firebase:", db.app.options.projectId);
        console.log("UID autenticado:", usuario.uid);

        
        // 2. Procurar o administrador na coleção usuarios
        const usuariosRef = collection(db, "usuarios");
        const snapshotAdmin = await getDocs(usuariosRef);

        console.log(
            "Total de documentos na coleção usuarios:",
            snapshotAdmin.size
        );

        console.log(
            "E-mail autenticado:",
            JSON.stringify(emailAutenticado)
        );

        let administradorEncontrado = false;

        snapshotAdmin.forEach((documento) => {
            const dados = documento.data();

            const emailBanco =
                typeof dados.email === "string"
                    ? dados.email.trim().toLowerCase()
                    : "";

            const perfilBanco =
                typeof dados.perfil === "string"
                    ? dados.perfil.trim().toLowerCase()
                    : "";

            console.log("ID do documento:", documento.id);
            console.log("E-mail no banco:", JSON.stringify(emailBanco));
            console.log("Perfil:", perfilBanco);

            if (
                emailBanco === emailAutenticado &&
                perfilBanco === "admin"
            ) {
                administradorEncontrado = true;
            }
        });


        // 3. Verificar autorização administrativa
        if (!administradorEncontrado) {
            throw new Error(
                "Login realizado, mas o perfil de administrador não foi encontrado para este e-mail."
            );
        }

        // 4. Redirecionar para o painel administrativo
        console.log("Administrador autorizado!");
        alert("TESTE: chegou à etapa de redirecionamento!");

        window.location.href = "./admin.html";

        const destino = new URL(
            "./admin.html",
            window.location.href
        );

        console.log("Tentando abrir:", destino.href);

        mensagem.style.color = "#247A43";
        mensagem.textContent =
            "Login autorizado! Abrindo painel...";

        window.location.assign(destino.href);

    } catch (erro) {
        console.error("Erro no login administrativo:", erro);

        // Encerrar a sessão se a autenticação já aconteceu,
        // mas a autorização falhou.
        if (usuarioAutenticado) {
            try {
                await signOut(auth);
            } catch (erroSaida) {
                console.error(
                    "Erro ao encerrar sessão:",
                    erroSaida
                );
            }
        }

        if (erro.code === "permission-denied") {
            mensagem.textContent =
                "Sem permissão para consultar o perfil. Verifique as regras do Firestore.";
        } else if (
            erro.code === "unavailable" ||
            erro.code === "failed-precondition"
        ) {
            mensagem.textContent =
                "Não foi possível consultar o banco de dados. Tente novamente.";
        } else if (
            erro.code === "auth/invalid-credential"
        ) {
            mensagem.textContent =
                "E-mail ou senha incorretos.";
        } else if (
            erro.code === "auth/too-many-requests"
        ) {
            mensagem.textContent =
                "Muitas tentativas de login. Aguarde e tente novamente.";
        } else {
            mensagem.textContent =
                erro.message ||
                "Não foi possível realizar o login.";
        }

        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});
