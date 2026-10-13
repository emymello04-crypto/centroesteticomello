
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

        // 2. Verificar se o e-mail corresponde a um documento
        // da coleção usuarios no Firestore
        const usuariosRef = collection(db, "usuarios");

        const consultaAdmin = query(
            usuariosRef,
            where("email", "==", emailAutenticado)
        );

        const snapshotAdmin = await getDocs(consultaAdmin);

        console.log(
            "Documentos encontrados pelo e-mail:",
            snapshotAdmin.size
        );

        let administradorEncontrado = false;

        snapshotAdmin.forEach((documento) => {
            const dados = documento.data();

            console.log("ID do documento:", documento.id);
            console.log("E-mail no Firestore:", dados.email);
            console.log("Perfil encontrado:", dados.perfil);

            const mesmoEmail =
                typeof dados.email === "string" &&
                dados.email.trim().toLowerCase() === emailAutenticado;

            const ehAdmin =
                typeof dados.perfil === "string" &&
                dados.perfil.trim().toLowerCase() === "admin";

            if (mesmoEmail && ehAdmin) {
                administradorEncontrado = true;
            }
        });

        // 3. Bloquear acesso se não for administrador
        if (!administradorEncontrado) {
            throw new Error(
                "O login foi realizado, mas o usuário não possui um perfil de administrador correspondente na coleção usuarios."
            );
        }

        // 4. Acesso autorizado
        console.log("Administrador autorizado!");

        window.location.href = "admin.html";

    } catch (erro) {
        console.error("Erro no login administrativo:", erro);

        // Encerrar a sessão se o login já tiver sido realizado,
        // mas ocorrer uma falha na verificação do administrador.
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
        } else if (erro.code === "auth/invalid-credential") {
            mensagem.textContent =
                "E-mail ou senha incorretos.";
        } else if (erro.code === "auth/too-many-requests") {
            mensagem.textContent =
                "Muitas tentativas de login. Aguarde e tente novamente.";
        } else {
            mensagem.textContent =
                erro.message || "Não foi possível realizar o login.";
        }

        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});
