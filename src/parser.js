
const validInstructions = {
    stp: {
        args: 0,
        detail: "stop",
        documentation: "Zakończenie programu"
    },
    rpa: {
        args: 0,
        detail: "Rezerwuj pamięć",
        documentation: "Pseudo-rozkaz rezerwujący pamięć"
    },
    rst: {
        args: 1,
        detail: "Rezeruj stałą",
        documentation: `Pseudo-rozkaz rezerwujący stałą o wartości podanej w argumencie.\n
        Dla pojedyńczego znaku wpisuje do pamięci kod ASCII.`
    },
    dod: {
        args: 1,
        detail: "(Ak) + ((AD)) ---> Ak",
        documentation: "Dodaj wartość pod adresem wskazywanym przez argument do wartości akumulatora"
    },
    ode: {
        args: 1,
        detail: "(Ak) - ((AD)) ---> Ak",
        documentation: "Odejmij wartość pod adresem wskazywanym przez argument od wartości akumulatora"
    },
    pob: {
        args: 1,
        detail: "((AD)) ---> Ak",
        documentation: "Pobierz wartość spod adresu wskazywanego przez argument do akumulatora"
    },
    ład: {
        args: 1,
        detail: "(Ak) ---> (AD)",
        documentation: "Zapisz wartość akumulatora pod adres wskazywany przez argument"
    },
    lad: {
        args: 1,
        detail: "(Ak) ---> (AD)",
        documentation: "Zapisz wartość akumulatora pod adres wskazywany przez argument"
    },
    sob: {
        args: 1,
        detail: "Skok bezwarunkowy (AD) ---> L,A",
        documentation: "Skok bezwarunkowy pod adres wskazywany przez argument"
    },
    soz: {
        args: 1,
        detail: "Skok gdy (AK) = 0 (AD) ---> L,A",
        documentation: "Skok jeżeli 0 w akumulatorze pod adres wskazywany przez argument"
    },
    som: {
        args: 1,
        detail: "Skok gdy (AK) < 0 (AD) ---> L,A",
        documentation: "Skok przy wartości ujemnej w akumulatorze pod adres wskazywany przez argument"
    },
    dns: {
        args: 0,
        detail: "Dane na stos (AK) ---> (WS)",
        documentation: `Zapisuje wartość akumulatora na stosie pod adresem wskazywanym przez wskaźnik stosu.\n Dekrementuje wskaźnik stosu.`
    },
    pzs: {
        args: 0,
        detail: "Pobierz z stosu ((WS)) ---> AK",
        documentation: `Pobiera wartość ze stosu pod adresem wskazywanym przez wskaźnik stosu do akumulatora.\n Inkrementuje wskaźnik stosu.`
    },
    sdp: {
        args: 1,
        detail: "Skok do podprogramu (L) ---> (WS); (AD) ---> L,A",
        documentation: `Skok do podprogramu pod adres wskazywany przez argument\n
                        Zapisuje adres powrotu na stosie pod adresem wskazywanym przez wskaźnik stosu.\n
                        Dekrementuje wskaźnik stosu.`
    },
    pwr: {
        args: 0,
        detail: "Powrót z podprogramu ((WS)) ---> L,A",
        documentation: `Powrót z podprogramu pod adres wskazywany przez wskaźnik stosu.\n
                        Inkrementuje wskaźnik stosu.`
    },
    wpr: {
        args: 1,
        detail: "Wprowadź znak (UZ) ---> AK",
        documentation: `Wprowadza znak z urządzenia zewnętrznego do akumulatora.\n
                        Wartość znaku jest kodem ASCII.\n
                        Argument określa numer urządzenia zewnętrznego.\n
                        **1** - konsola wejścia.`
    },
    wyp: {
        args: 1,
        detail: "Wyprowadź znak (AK) ---> UZ",
        documentation: `Wyprowadza znak z akumulatora do urządzenia zewnętrznego.\n
                        Wartość znaku jest kodem ASCII.\n
                        Argument określa numer urządzenia zewnętrznego.\n
                        **2** - konsola wyjścia.`
    },
    mas: {
        args: 1,
        detail: "Maskowanie natychmiastowe (AD) ---> RM",
        documentation: "Zapisuje do rejestru maski wartość argumentu"
    },
    msk: {
        args: 1,
        detail: "Maskowanie bezpośrednie ((AD)) ---> RM",
        documentation: "Zapisuje do rejestru maski wartość z pamięci pod adresem wskazywanym przez argument"
    },
    czm: {
        args: 0,
        detail: "Odczyt rejestru maski (RM) ---> (AD)",
        documentation: "Zapisuje wartość rejestru maski do pamięci pod adresem wskazywanym przez argument"
    },
}

const labels = new Set()

function parseLine(line, lineNumber) {
    const errors = []
    const trimmedLine = line.trim()

    
    const commentIndex = Math.min(
        trimmedLine.indexOf("//") !== -1 ? trimmedLine.indexOf("//") : trimmedLine.length,
        trimmedLine.indexOf(";") !== -1 ? trimmedLine.indexOf(";") : trimmedLine.length
    );

    const codePart = trimmedLine.substring(0, commentIndex).trim();

    // Jeśli po usunięciu komentarza linia jest pusta, ignorujemy ją
    if (!codePart) {
        return errors
    }

    // Funkcja do obliczenia ilości białych znaków na początku linii
    const frontWhiteSpaces = (str) => {
        let whiteSpaces = 0
        for (let i = 0; i < str.length; i++) {
            if (str[i].trim() === "") whiteSpaces++ 
            else break
        }
        return whiteSpaces
    }

    // Funkcja do sprawdzenia czy dwukropek jest wewnątrz pojedynczego cudzysłowu
    const colonAsCharacter = (str) => {
        const regex = /'([^']|'')*'/g // Dopasowanie ciągu wewnątrz pojedynczych cudzysłowów, w tym z escape'owanymi znakami
        let match
        let colon = false
        
        while (match = regex.exec(str)) {
            if (match[0].includes(":")) {
                colon = true
            }
        }
        return colon
    }

    const validateArgument = (arg, index) => {
        if (/^\d+$/.test(arg)) { // liczba
            return
        } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(arg) && labels.has(arg)) { // etykieta
            return
        } else if (/^'[^']{1}'$/.test(arg)) { // znak
            return
        } else { // Niepoprawny argument
            errors.push({
                message: `Niepoprawny argument: "${arg}". Oczekiwano liczby, etykiety lub pojedynczego znaku.`,
                line: lineNumber,
                charStart: index + 1,
                charEnd: index + arg.length + 1,
            });
        }
    }


    const colonIndex = codePart.indexOf(":");
    let label = null;
    let restOfLine = codePart;
    let whiteSpaces = 0
    // etykieta 
    if (colonIndex !== -1 && !colonAsCharacter(codePart)) {
        label = codePart.substring(0, colonIndex + 1).trim();
        restOfLine = codePart.substring(colonIndex + 1);
        const afterColon = restOfLine.length > 0 ? restOfLine[0].trim() : "";
        // oblicz ilość białych znaków po dwukropku
        whiteSpaces = frontWhiteSpaces(restOfLine)
        restOfLine = restOfLine.trim()

        if (afterColon !== "") {
            errors.push({
                message: `Nieprawidłowa etykieta: "${label}". Wymagany jest przynajmniej jeden biały znak po dwukropku.`,
                line: lineNumber,
                charStart: 0,
                charEnd: line.length,
            })
        }
        else if (!/^[a-zA-Z0-9_]*:$/.test(label)) {
            errors.push({
                message: `Nieprawidłowa etykieta: "${label}". Nazwa może zawierać tylko litery, cyfry i podkreślenia.`,
                line: lineNumber,
                charStart: 0,
                charEnd: colonIndex,
            });
        }
        else labels.add(label.substring(0, label.length - 1));
    }
    else whiteSpaces = frontWhiteSpaces(line)

    // instrukcja
    if (restOfLine) {
        const [instruction, ...args] = restOfLine.split(/\s+/);
        if (!validInstructions[instruction.toLowerCase()]) {
            errors.push({
                message: `Nieznana instrukcja: "${instruction}".`,
                line: lineNumber,
                charStart: whiteSpaces + colonIndex + 1,
                charEnd: whiteSpaces + colonIndex + 1 + instruction.length,
            });
        }
        else if (validInstructions[instruction.toLowerCase()].args === 0 && args.length !== 0) {
            errors.push({
                message: `Za dużo liczba argumentów dla instrukcji "${instruction}". Oczekiwano 0`,
                line: lineNumber,
                charStart: whiteSpaces + colonIndex + 1,
                charEnd: whiteSpaces + colonIndex + 1 + instruction.length,
            });
        }
        else if (validInstructions[instruction.toLowerCase()].args === 1 && args.length !== 1) {
            errors.push({
                message: `Nieprawidłowa ilość argumentów dla instrukcji "${instruction}". Oczekiwano 1.`,
                line: lineNumber,
                charStart: whiteSpaces + colonIndex + 1,
                charEnd: whiteSpaces + colonIndex + 1 + instruction.length,
            });
        }
        else if (args.length > 0) {
            validateArgument(args[0], whiteSpaces + colonIndex + 1 + instruction.length);
        }
    }

    return errors;
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
    validInstructions,
}