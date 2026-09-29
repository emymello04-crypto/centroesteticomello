import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    collection,
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

    botao.disabled = true;
    botao.textContent = "Entrando...";
    mensagem.textContent = "";

    try {

        // 1. Verifica o login no Authentication
        const resultado = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        console.log("LOGIN AUTH OK:", resultado.user.email);

        // 2. Busca TODOS os usuários do Firestore
        const usuariosRef = collection(db, "usuarios");
        const snapshot = await getDocs(usuariosRef);

        console.log("Quantidade de documentos:", snapshot.size);

        let encontrado = false;

        snapshot.forEach((documento) => {

            const dados = documento.data();

            console.log(
                "Documento:",
                documento.id,
                dados
            );

            // Compara o e-mail sem diferenciar maiúsculas/minúsculas
            if (
                dados.email &&
                dados.email.trim().toLowerCase() ===
                resultado.user.email.trim().toLowerCase()
            ) {

                encontrado = true;

                console.log(
                    "USUÁRIO ENCONTRADO:",
                    dados
                );

                if (
                    dados.perfil === "Administrador" &&
                    dados.status === "Ativo"
                ) {

                    window.location.href = "admin.html";

                } else {

                    throw new Error(
                        "O usuário existe, mas não é um administrador ativo."
                    );
                }
            }
        });

        if (!encontrado) {

            await signOut(auth);

            throw new Error(
                "O login funcionou, mas nenhum documento com esse e-mail foi encontrado na coleção usuarios."
            );
        }

    } catch (erro) {

        console.error("ERRO COMPLETO:", erro);

        mensagem.textContent = erro.message;

        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});