const validSignals = {
    czyt: {
            detail: "czytaj z pamięci",
            edge_trigger: false,    
    }, // poziomowy
    wys: {
        detail: "wyjście r. słowowego",
        edge_trigger: false,
    },
    wei: {
        detail: "wejście r. instrukcji",
        edge_trigger: true,
    }, // impulsoowy
    il: {
        detail: "inkrementacja licznika",
        edge_trigger: true,
    },
    pisz: {
        detail: "zapisz do pamięci",
        edge_trigger: false,
    },
    wes: {
        detail: "wejście r. słowowego",
        edge_trigger: true,
    }, // impulsowy
    weja: {
        detail: "wejście j. arytmetycznej",
        edge_trigger: false,
    },
    przep: {
        detail: "przepisz do AK",
        edge_trigger: false,
    },
    ode: {
        detail: "odejmowanie w JAL",
        edge_trigger: false,
    },
    dod: {
        detail: "dodawanie w JAL",
        edge_trigger: false,
    },
    weak: {
        detail: "wejście AK",
        edge_trigger: true,
    }, // impulsowy
    wyak: {
        detail: "wyjście AK",
        edge_trigger: false,
    },
    wyad: {
        detail: "wyjście części adresowej z r. instrukcji",
        edge_trigger: false,
    },
    wyl: {
        detail: "wyjście licznika",
        edge_trigger: false,
    },
    wel: {
        detail: "wejście licznika",
        edge_trigger: true,
    }, // impulsowy
    wea: {
        detail: "wejście r. adresowego",
        edge_trigger: true,
    }, // impulsowy
    as: {
        detail: "połączenie międzymagistralowe",
        edge_trigger: false,
    },
    sa: {
        detail: "połączenie międzymagistralowe",
        edge_trigger: false,
    },
    wews: {
        detail: "wejście r. wskaźnika stosu",
        edge_trigger: true,
    },
    wyws: {
        detail: "wyjście r. wskaźnika stosu",
        edge_trigger: false,
    },
    iws: {
        detail: "inkrementacja wskaźnika stosu",
        edge_trigger: true,
    },
    dws: {
        detail: "dekrementacja wskaźnika stosu",
        edge_trigger: true,
    },
}
const condtionalStatement = ["JEŻELI Z TO", "JEŻELI ZAK TO", "GDY NIE", "KONIEC", "ROZKAZ"]
const labels = new Set()

const parseLine = (line, lineNumber) => {
    const errors = []
    const trimmedLine = line.trim()

    
    const commentIndex = trimmedLine.indexOf("//") !== -1 ? trimmedLine.indexOf("//") : trimmedLine.length

    const codePart = trimmedLine.substring(0, commentIndex).trim();

    // Jeśli po usunięciu komentarza linia jest pusta, ignorujemy ją
    if (codePart) {
        // console.log(codePart)
        if (codePart[codePart.length - 1] !== ";") {
            errors.push({
                line: lineNumber,
                charStart: codePart.length,
                charEnd: codePart.length + 1,
                message: "Brakuje średnika na końcu linii"
            })
        }
        const signals = codePart.split(/\s+/)
        console.log(signals)
    }
    return errors
}

const analyzeDocument = (document) => {
    const errors = []
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text
        const lineErrors = parseLine(line, i)
        errors.push(...lineErrors)
    }
    return errors
}

module.exports = {
    analyzeDocument,
    validSignals,
    condtionalStatement,
    labels
}