class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = parseFloat(preco);
        this.quantidade = parseInt(quantidade, 10);
    }

    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}


// Lista de produtos
const listaDeProdutos = [];


// Chave usada para salvar os dados
const CHAVE_STORAGE = "sistema_estoque_produtos";


// Controla o modo de edição
// null = cadastro
// número = índice do produto em edição
let indiceEdicao = null;


// Elementos do HTML
const formProduto = document.getElementById("produto-form");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const btnSalvar = document.getElementById("btn-salvar");
const btnCancelarEdicao = document.getElementById("btn-cancelar-edicao");
const campoNomeEl = document.getElementById("nome");
const campoPrecoEl = document.getElementById("preco");
const campoQuantidadeEl = document.getElementById("quantidade");
const sugestoesEl = document.getElementById("sugestoes");
const toastContainerEl = document.getElementById("toast-container");


/* =========================================================
   TOAST (substitui o alert)
   tipos: success | danger | warning | info
   ========================================================= */
function mostrarToast(mensagem, tipo = "success") {
    const toastEl = document.createElement("div");

    // text-bg-warning e text-bg-info usam texto escuro; os demais, claro
    toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
    toastEl.setAttribute("role", tipo === "danger" ? "alert" : "status");

    const flex = document.createElement("div");
    flex.className = "d-flex";

    const corpo = document.createElement("div");
    corpo.className = "toast-body";
    corpo.textContent = mensagem;

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "btn-close me-2 m-auto";
    fechar.setAttribute("data-bs-dismiss", "toast");
    fechar.setAttribute("aria-label", "Fechar");

    if (tipo === "success" || tipo === "danger") {
        fechar.classList.add("btn-close-white");
    }

    flex.appendChild(corpo);
    flex.appendChild(fechar);
    toastEl.appendChild(flex);
    toastContainerEl.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });

    // Remove o elemento do HTML depois que o toast some
    toastEl.addEventListener("hidden.bs.toast", function () {
        toastEl.remove();
    });

    toast.show();
}


/* =========================================================
   MODAL DE CONFIRMAÇÃO (substitui o confirm)
   ========================================================= */
const modalConfirmacaoEl = document.getElementById("modal-confirmacao");
const modalConfirmacao = new bootstrap.Modal(modalConfirmacaoEl);
const confirmacaoTituloEl = document.getElementById("confirmacao-titulo");
const confirmacaoMensagemEl = document.getElementById("confirmacao-mensagem");
const confirmacaoOkEl = document.getElementById("confirmacao-ok");

let acaoConfirmada = null;

function pedirConfirmacao({ titulo, mensagem, textoBotao, aoConfirmar }) {
    confirmacaoTituloEl.textContent = titulo;
    confirmacaoMensagemEl.textContent = mensagem;
    confirmacaoOkEl.textContent = textoBotao;
    acaoConfirmada = aoConfirmar;

    modalConfirmacao.show();
}

confirmacaoOkEl.addEventListener("click", function () {
    const acao = acaoConfirmada;
    acaoConfirmada = null;

    modalConfirmacao.hide();

    if (acao) {
        acao();
    }
});

// Foco no botão de confirmar ao abrir (Enter confirma, Esc cancela)
modalConfirmacaoEl.addEventListener("shown.bs.modal", function () {
    confirmacaoOkEl.focus();
});

modalConfirmacaoEl.addEventListener("hidden.bs.modal", function () {
    acaoConfirmada = null;
});


/* =========================================================
   LOCALSTORAGE
   ========================================================= */

// Salvar produtos no LocalStorage
function salvarNoLocalStorage() {
    const listaEmTexto = JSON.stringify(listaDeProdutos);

    localStorage.setItem(CHAVE_STORAGE, listaEmTexto);
}


// Carregar produtos salvos
function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);

    if (dadosSalvos) {
        try {
            const produtosObjetos = JSON.parse(dadosSalvos);

            if (!Array.isArray(produtosObjetos)) {
                throw new Error("Formato de dados inválido.");
            }

            produtosObjetos.forEach((prod) => {
                const produtoInstanciado = new Produto(
                    prod.nome,
                    prod.preco,
                    prod.quantidade
                );

                listaDeProdutos.push(produtoInstanciado);
            });
        } catch (erro) {
            console.error("Erro ao carregar os produtos:", erro);
            mostrarToast("Não foi possível carregar os produtos salvos.", "danger");
        }
    }
}


/* =========================================================
   FORMULÁRIO
   ========================================================= */

// Marca um campo com erro, avisa e leva o foco até ele
function invalidarCampo(campo, mensagem) {
    campo.classList.add("campo-invalido");
    campo.focus();
    mostrarToast(mensagem, "warning");
}

// Remove a marcação de erro ao digitar
[campoNomeEl, campoPrecoEl, campoQuantidadeEl].forEach((campo) => {
    campo.addEventListener("input", function () {
        campo.classList.remove("campo-invalido");
    });
});


// Volta o formulário ao modo cadastro
function sairDoModoEdicao() {
    indiceEdicao = null;
    btnSalvar.textContent = "Adicionar Produto";
    btnCancelarEdicao.hidden = true;
    formProduto.reset();

    [campoNomeEl, campoPrecoEl, campoQuantidadeEl].forEach((campo) => {
        campo.classList.remove("campo-invalido");
    });
}


// Cadastro e edição de produtos
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    // Captura os dados do formulário
    const nome = campoNomeEl.value.trim();
    const preco = Number(campoPrecoEl.value);
    const quantidade = Number(campoQuantidadeEl.value);


    // Validação do nome
    if (!nome) {
        invalidarCampo(campoNomeEl, "Informe um nome válido para o produto.");
        return;
    }


    // Validação do preço
    if (!Number.isFinite(preco) || preco <= 0) {
        invalidarCampo(campoPrecoEl, "O preço deve ser um número maior que zero.");
        return;
    }


    // Validação da quantidade
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        invalidarCampo(campoQuantidadeEl, "A quantidade deve ser um número inteiro maior que zero.");
        return;
    }


    // Cria o produto após validar os dados
    const novoProduto = new Produto(nome, preco, quantidade);


    // Verifica se está cadastrando ou editando
    if (indiceEdicao === null) {
        // CREATE: adiciona um novo produto
        listaDeProdutos.push(novoProduto);

        mostrarToast(`"${nome}" foi cadastrado.`, "success");
    } else {
        // UPDATE: substitui o produto existente
        listaDeProdutos[indiceEdicao] = novoProduto;

        mostrarToast(`"${nome}" foi atualizado.`, "success");
    }


    // Salva os dados
    salvarNoLocalStorage();


    // Restaura o modo cadastro, limpa o formulário e atualiza a tela
    sairDoModoEdicao();
    sugestoesEl.classList.remove("ativo");
    atualizarInterface();

    // Pronto para cadastrar o próximo
    campoNomeEl.focus();
});


// Cancelar edição
btnCancelarEdicao.addEventListener("click", function () {
    sairDoModoEdicao();
    atualizarInterface();
    mostrarToast("Edição cancelada.", "info");
});


// Preparar produto para edição
function prepararEdicao(index) {
    const produto = listaDeProdutos[index];

    if (!produto) {
        return;
    }


    // Preenche os campos com os dados do produto
    campoNomeEl.value = produto.nome;
    campoPrecoEl.value = produto.preco;
    campoQuantidadeEl.value = produto.quantidade;


    // Ativa o modo edição
    indiceEdicao = index;

    btnSalvar.textContent = "Salvar Alterações";
    btnCancelarEdicao.hidden = false;

    sugestoesEl.classList.remove("ativo");
    atualizarInterface();


    // Leva o formulário até a área visível
    formProduto.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    campoPrecoEl.focus();
}


/* =========================================================
   REMOVER / LIMPAR
   ========================================================= */

// Remover um produto (pede confirmação no modal)
function removerProduto(index) {
    const produto = listaDeProdutos[index];

    if (!produto) {
        return;
    }

    pedirConfirmacao({
        titulo: "Remover produto",
        mensagem: `Deseja remover o produto "${produto.nome}"? Esta ação não pode ser desfeita.`,
        textoBotao: "Remover",
        aoConfirmar: function () {
            // Remove o produto da lista
            listaDeProdutos.splice(index, 1);


            // Cancela a edição se o produto removido estava sendo editado
            if (indiceEdicao === index) {
                sairDoModoEdicao();
            } else if (indiceEdicao !== null && indiceEdicao > index) {
                // Ajusta o índice se um item anterior foi removido
                indiceEdicao--;
            }


            // Salva e atualiza
            salvarNoLocalStorage();
            atualizarInterface();

            mostrarToast(`"${produto.nome}" foi removido.`, "danger");
        }
    });
}


// Limpar todos os produtos (pede confirmação no modal)
btnLimparTudo.addEventListener("click", function () {
    const quantidade = listaDeProdutos.length;

    if (quantidade === 0) {
        mostrarToast("A tabela já está vazia.", "info");
        return;
    }

    pedirConfirmacao({
        titulo: "Limpar tudo",
        mensagem: `Tem certeza que deseja remover os ${quantidade} produto(s) cadastrados? Esta ação não pode ser desfeita.`,
        textoBotao: "Limpar tudo",
        aoConfirmar: function () {
            listaDeProdutos.length = 0;

            localStorage.removeItem(CHAVE_STORAGE);

            sairDoModoEdicao();
            atualizarInterface();

            mostrarToast("Todos os produtos foram removidos.", "danger");
        }
    });
});


/* =========================================================
   TABELA, TOTAL E BUSCA
   ========================================================= */

// Filtrar produtos pelo termo digitado (a lista original não é alterada)
function obterProdutosFiltrados() {
    // Durante a edição a tabela completa é mantida
    if (indiceEdicao !== null) {
        return listaDeProdutos.slice();
    }

    const termo = campoNomeEl.value.trim().toLowerCase();

    return listaDeProdutos.filter((produto) => {
        return produto.nome.toLowerCase().includes(termo);
    });
}


// Calcular o valor total do estoque (somente itens visíveis)
function atualizarTotalEstoque() {
    const total = obterProdutosFiltrados().reduce((acc, produto) => {
        return acc + produto.calcularSubtotal();
    }, 0);

    totalEstoqueEl.textContent =
        `Total em estoque: ${total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })}`;
}


// Renderizar a tabela de produtos
function renderizarTabela() {
    const tabelaBody = document.querySelector(
        "#tabela-produtos tbody"
    );

    tabelaBody.innerHTML = "";

    // Desativa "Limpar Tudo" quando não há nada para limpar
    btnLimparTudo.disabled = listaDeProdutos.length === 0;


    const produtosVisiveis = obterProdutosFiltrados();

    // Mensagem quando não há itens para exibir
    if (produtosVisiveis.length === 0) {
        const linhaVazia = document.createElement("tr");
        const celulaVazia = document.createElement("td");

        celulaVazia.colSpan = 5;
        celulaVazia.classList.add("mensagem-vazia");
        celulaVazia.textContent = listaDeProdutos.length === 0
            ? "Nenhum produto cadastrado. Preencha o formulário acima para adicionar o primeiro."
            : "Produto não localizado.";

        linhaVazia.appendChild(celulaVazia);
        tabelaBody.appendChild(linhaVazia);
        return;
    }


    produtosVisiveis.forEach((produto) => {
        // Índice real na lista original (necessário para editar/remover)
        const index = listaDeProdutos.indexOf(produto);

        const linha = document.createElement("tr");

        // Destaca a linha que está sendo editada
        if (index === indiceEdicao) {
            linha.classList.add("em-edicao");
        }


        // Cria as células com segurança usando textContent
        const celulaNome = document.createElement("td");
        celulaNome.textContent = produto.nome;

        const celulaPreco = document.createElement("td");
        celulaPreco.textContent = produto.preco.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

        const celulaQuantidade = document.createElement("td");
        celulaQuantidade.textContent = produto.quantidade;

        const celulaSubtotal = document.createElement("td");
        celulaSubtotal.textContent = produto.calcularSubtotal()
            .toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });


        // Coluna de ações
        const celulaAcoes = document.createElement("td");


        // Botão Editar
        const btnEditar = document.createElement("button");

        btnEditar.type = "button";
        btnEditar.textContent = "Editar";
        btnEditar.classList.add("btn-editar");
        btnEditar.setAttribute("aria-label", `Editar ${produto.nome}`);

        btnEditar.addEventListener("click", function () {
            prepararEdicao(index);
        });


        // Botão Remover
        const btnRemover = document.createElement("button");

        btnRemover.type = "button";
        btnRemover.textContent = "Remover";
        btnRemover.classList.add("btn-remover");
        btnRemover.setAttribute("aria-label", `Remover ${produto.nome}`);

        btnRemover.addEventListener("click", function () {
            removerProduto(index);
        });


        // Adiciona os botões à célula
        celulaAcoes.appendChild(btnEditar);
        celulaAcoes.appendChild(btnRemover);


        // Adiciona todas as células à linha
        linha.appendChild(celulaNome);
        linha.appendChild(celulaPreco);
        linha.appendChild(celulaQuantidade);
        linha.appendChild(celulaSubtotal);
        linha.appendChild(celulaAcoes);


        // Adiciona a linha à tabela
        tabelaBody.appendChild(linha);
    });
}


// Atualizar toda a interface
function atualizarInterface() {
    renderizarTabela();
    atualizarTotalEstoque();
}


/* =========================================================
   SUGESTÕES DO CAMPO NOME
   ========================================================= */

// Exibe sugestões de produtos já cadastrados com base no que foi digitado
function atualizarSugestoes() {
    sugestoesEl.innerHTML = "";

    const termo = campoNomeEl.value.trim();

    if (!termo || indiceEdicao !== null) {
        sugestoesEl.classList.remove("ativo");
        return;
    }

    // Nomes únicos, no máximo 5 sugestões
    const nomes = [...new Set(
        obterProdutosFiltrados().map((produto) => produto.nome)
    )].slice(0, 5);

    if (nomes.length === 0) {
        sugestoesEl.classList.remove("ativo");
        return;
    }

    nomes.forEach((nome) => {
        const item = document.createElement("li");
        item.textContent = nome;

        // mousedown evita que o input perca o foco antes do clique
        item.addEventListener("mousedown", function (event) {
            event.preventDefault();
            campoNomeEl.value = nome;
            sugestoesEl.classList.remove("ativo");
            atualizarInterface();
        });

        sugestoesEl.appendChild(item);
    });

    sugestoesEl.classList.add("ativo");
}


// Digitação em tempo real no campo Nome: sugestões + tabela + total
campoNomeEl.addEventListener("input", function () {
    atualizarSugestoes();
    atualizarInterface();
});

// Fecha as sugestões ao sair do campo ou pressionar Esc
campoNomeEl.addEventListener("blur", function () {
    sugestoesEl.classList.remove("ativo");
});

campoNomeEl.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        sugestoesEl.classList.remove("ativo");
    }
});


// Inicialização do sistema
carregarDoLocalStorage();
atualizarInterface();
