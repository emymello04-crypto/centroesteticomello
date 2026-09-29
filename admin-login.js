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

    mensagem.textContent = "";

    botao.disabled = true;
    botao.textContent = "Entrando...";

    try {

        // LOGIN NO FIREBASE AUTHENTICATION
        const resultado = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        console.log("Login realizado:", resultado.user.email);


        // BUSCA OS USUÁRIOS NO FIRESTORE
        const usuariosRef = collection(db, "usuarios");

        const snapshot = await getDocs(usuariosRef);

        console.log(
            "Usuários encontrados no Firestore:",
            snapshot.size
        );


        let administradorEncontrado = false;


        snapshot.forEach((documento) => {

            const dados = documento.data();

            console.log(
                "Documento:",
                documento.id,
                dados
            );


            // CONFERE O EMAIL
            const mesmoEmail =
                dados.email &&
                dados.email.trim().toLowerCase() ===
                resultado.user.email.trim().toLowerCase();


            // CONFERE SE É ADMIN
            const ehAdmin =
                dados.perfil &&
                dados.perfil.toLowerCase() === "admin";


            if (mesmoEmail && ehAdmin) {

                administradorEncontrado = true;

            }

        });


        // SE NÃO FOR ADMIN
        if (!administradorEncontrado) {

            await signOut(auth);

            throw new Error(
                "Este usuário não possui perfil de administrador."
            );
        }


        // LOGIN AUTORIZADO
        console.log("Administrador autorizado!");

        window.location.href = "admin.html";


    } catch (erro) {

        console.error(
            "ERRO COMPLETO:",
            erro
        );

        mensagem.textContent = erro.message;

        botao.disabled = false;
        botao.textContent = "Entrar";
    }

});