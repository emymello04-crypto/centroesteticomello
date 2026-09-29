import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const mensagem = document.getElementById("mensagem");
const botao = document.getElementById("btnLogin");


form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    mensagem.textContent = "";

    botao.disabled = true;
    botao.textContent = "Entrando...";

    try {

        // Login no Firebase Authentication
        const resultado =
            await signInWithEmailAndPassword(
                auth,
                email,
                senha
            );

        const usuario = resultado.user;

        // Procura o usuário no Firestore
        const usuariosRef =
            collection(db, "usuarios");

        const consulta =
            query(
                usuariosRef,
                where("email", "==", usuario.email)
            );

        const resultadoFirestore =
            await getDocs(consulta);

        if (resultadoFirestore.empty) {

            await signOut(auth);

            throw new Error(
                "Usuário não encontrado no Firestore."
            );
        }

        let administrador = false;

        resultadoFirestore.forEach((documento) => {

            const dados = documento.data();

            console.log(
                "Usuário encontrado:",
                dados
            );

            if (
                dados.perfil === "Administrador" &&
                dados.status === "Ativo"
            ) {
                administrador = true;
            }
        });

        if (!administrador) {

            await signOut(auth);

            throw new Error(
                "Este usuário não possui permissão de administrador."
            );
        }

        // Login autorizado
        window.location.href = "admin.html";

    } catch (erro) {

        console.error(
            "Erro no login:",
            erro
        );

        mensagem.textContent =
            "E-mail, senha ou permissão de administrador inválidos.";

        botao.disabled = false;
        botao.textContent = "Entrar";
    }

});