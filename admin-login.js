import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
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
        const emailAutenticado = usuario.email?.trim().toLowerCase();

        console.log("Login realizado:", emailAutenticado);
        console.log("Projeto Firebase:", db.app.options.projectId);
        console.log("UID autenticado:", usuario.uid);


        try {
    const referencia = collection(db, "usuarios");
    const consulta = await getDocs(referencia);

    console.log("Coleção usuarios:", consulta.size);

    consulta.forEach((item) => {
        console.log("ID:", item.id);
        console.log("Dados:", item.data());
    });
} catch (erro) {
    console.error(
        "Erro Firestore:",
        erro.code,
        erro.message
    );
}

        // 2. Consultar o documento cujo ID corresponde ao UID
        const referenciaUID = doc(db, "usuarios", usuario.uid);
        const documentoUID = await getDoc(referenciaUID);

        let administradorEncontrado = false;

        if (documentoUID.exists()) {
            const dados = documentoUID.data();

            console.log("Perfil encontrado pelo UID:", dados.perfil);

            const mesmoEmail =
                typeof dados.email === "string" &&
                dados.email.trim().toLowerCase() === emailAutenticado;

            const ehAdmin =
                typeof dados.perfil === "string" &&
                dados.perfil.trim().toLowerCase() === "admin";

            administradorEncontrado = mesmoEmail && ehAdmin;
        }

        // 3. Se o documento não estiver identificado pelo UID,
        // procurar o usuário pelo e-mail na coleção.
        if (!administradorEncontrado) {
            const usuariosRef = collection(db, "usuarios");
            const snapshot = await getDocs(usuariosRef);

            console.log(
                "Documentos encontrados na coleção usuarios:",
                snapshot.size
            );

            snapshot.forEach((documento) => {
                const dados = documento.data();

                console.log("Documento consultado:", documento.id);

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
        }

        // 4. Bloquear o acesso caso o perfil não seja administrativo
        if (!administradorEncontrado) {
            await signOut(auth);
            usuarioAutenticado = false;

            throw new Error(
                "Não foi encontrado um perfil de administrador correspondente a este usuário."
            );
        }

        // 5. Acesso autorizado
        console.log("Administrador autorizado!");

        window.location.href = "admin.html";

    } catch (erro) {
        console.error("Erro no login administrativo:", erro);

        // Encerrar a sessão em caso de falha após autenticação,
        // inclusive se houver erro na consulta ao Firestore.
        if (usuarioAutenticado) {
            try {
                await signOut(auth);
            } catch (erroSaida) {
                console.error("Erro ao encerrar sessão:", erroSaida);
            }
        }

        if (erro.code === "permission-denied") {
            mensagem.textContent =
                "Sem permissão para verificar o perfil. Verifique as regras do Firestore.";
        } else if (
            erro.code === "unavailable" ||
            erro.code === "failed-precondition"
        ) {
            mensagem.textContent =
                "Não foi possível consultar o banco de dados. Tente novamente.";
        } else {
            mensagem.textContent =
                erro.message || "Não foi possível realizar o login.";
        }

        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});