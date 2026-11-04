#include <QCoreApplication>
#include <QFile>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonValue>
#include <QStringList>
#include <iostream>
#include <limits>
#include <sstream>
#include <iomanip>

#include "phyxcalculator.h"
#include "unitloader.h"

static QString calculationErrorName(int code)
{
    switch (code) {
        case PhyxCalculator::SyntaxError: return "SyntaxError";
        case PhyxCalculator::UnitsNotConvertibleError: return "UnitsNotConvertibleError";
        case PhyxCalculator::UnitNotDimensionlessError: return "UnitNotDimensionlessError";
        case PhyxCalculator::ValueNotPositiveError: return "ValueNotPositiveError";
        case PhyxCalculator::ValueNotIntegerError: return "ValueNotIntegerError";
        case PhyxCalculator::ValueComplexError: return "ValueComplexError";
        case PhyxCalculator::StringNotValidError: return "StringNotValidError";
        case PhyxCalculator::PrefixError: return "PrefixError";
        case PhyxCalculator::UnknownVariableError: return "UnknownVariableError";
        case PhyxCalculator::ProgramError: return "ProgramError";
        default: return QString("UnknownError%1").arg(code);
    }
}

static std::string formatLongDouble(long double val)
{
    if (val == 0.0L) return "0";
    std::ostringstream oss;
    oss << std::setprecision(std::numeric_limits<long double>::digits10 + 2) << val;
    return oss.str();
}

class CaseObserver : public QObject
{
    Q_OBJECT
public:
    PhyxCalculator *calc;
    QString lastKind;
    QString lastDisplay;
    QString convertedUnit;
    int decimalPrecision;
    char numberFormat;
    QString imaginaryUnit;
    bool useFractions;
    PhyxCalculator::OutputMode unitMode;
    PhyxCalculator::PrefixMode prefixMode;

    CaseObserver(PhyxCalculator *c)
        : calc(c),
          lastKind("silent"),
          decimalPrecision(6),
          numberFormat('g'),
          imaginaryUnit("j"),
          useFractions(false),
          unitMode(PhyxCalculator::MinimizeUnitOutputMode),
          prefixMode(PhyxCalculator::UsePrefix)
    {
        connect(calc, &PhyxCalculator::outputResult, this, &CaseObserver::onResult);
        connect(calc, &PhyxCalculator::outputError, this, &CaseObserver::onError);
        connect(calc, &PhyxCalculator::outputConverted, this, &CaseObserver::onConverted);
        connect(calc, &PhyxCalculator::outputText, this, &CaseObserver::onText);
    }

    void reset() {
        lastKind = "silent";
        lastDisplay.clear();
        convertedUnit.clear();
    }

public slots:
    void onResult() {
        lastKind = "result";
        if (calc->result()) {
            PhyxCalculator::ResultVariable r = calc->formatVariable(
                calc->result(),
                unitMode,
                prefixMode,
                decimalPrecision,
                numberFormat,
                imaginaryUnit,
                useFractions
            );
            lastDisplay = r.value + r.unit;
        }
    }

    void onError() {
        lastKind = "error";
        lastDisplay = calc->errorString();
    }

    void onConverted(QString unitText) {
        lastKind = "converted";
        convertedUnit = unitText;
        if (calc->result()) {
            PhyxCalculator::ResultVariable r = calc->formatVariable(
                calc->result(),
                unitMode,
                prefixMode,
                decimalPrecision,
                numberFormat,
                imaginaryUnit,
                useFractions
            );
            lastDisplay = r.value + unitText;
        }
    }

    void onText(QString text) {
        lastKind = "text";
        lastDisplay = text;
    }
};

static QJsonObject getPlatformInfo()
{
    QJsonObject plat;
    plat["os"] = "Linux (Ubuntu 26.04 LTS)";
    plat["arch"] = "x86_64";
    plat["compiler"] = QString("GCC %1").arg(__VERSION__);
    plat["qt"] = qVersion();
    plat["sizeof_long_double"] = (int)sizeof(long double);
    plat["digits_long_double"] = std::numeric_limits<long double>::digits;
    plat["digits10_long_double"] = std::numeric_limits<long double>::digits10;
    plat["sizeof_long_int"] = (int)sizeof(long int);
    plat["referenceBuild"] = "ubuntu-26.04-gcc15-qt5.15-qwt6.1";
    return plat;
}

int main(int argc, char *argv[])
{
    QCoreApplication app(argc, argv);

    QString targetCaseId;
    int targetStepIndex = -1;
    bool platformInfoOnly = false;

    for (int i = 1; i < argc; ++i) {
        QString arg = argv[i];
        if (arg == "--case" && i + 1 < argc) {
            targetCaseId = argv[++i];
        } else if (arg == "--step" && i + 1 < argc) {
            targetStepIndex = QString(argv[++i]).toInt();
        } else if (arg == "--platform-info") {
            platformInfoOnly = true;
        }
    }

    if (platformInfoOnly) {
        QJsonDocument doc(getPlatformInfo());
        std::cout << doc.toJson(QJsonDocument::Indented).toStdString() << std::endl;
        return 0;
    }

    if (targetCaseId.isEmpty()) {
        std::cerr << "Usage: runner --case <case-id> | --platform-info" << std::endl;
        return 1;
    }

    // Load cases.json
    QFile file("compatibility/cases.json");
    if (!file.open(QIODevice::ReadOnly)) {
        std::cerr << "Cannot open compatibility/cases.json" << std::endl;
        return 1;
    }

    QJsonDocument doc = QJsonDocument::fromJson(file.readAll());
    file.close();

    QJsonObject root = doc.object();
    QJsonObject defaultProfile = root["profile"].toObject();
    QJsonArray cases = root["cases"].toArray();

    QJsonObject targetCase;
    bool found = false;
    for (const QJsonValue &v : cases) {
        QJsonObject c = v.toObject();
        if (c["id"].toString() == targetCaseId) {
            targetCase = c;
            found = true;
            break;
        }
    }

    if (!found) {
        std::cerr << "Case not found: " << targetCaseId.toStdString() << std::endl;
        return 2;
    }

    // Build settings
    QJsonObject caseSettings = targetCase["settings"].toObject();
    bool useFractions = defaultProfile["useFractions"].toBool();
    if (caseSettings.contains("useFractions")) {
        useFractions = caseSettings["useFractions"].toBool();
    }
    int decimalPrecision = defaultProfile["decimalPrecision"].toInt(6);
    if (caseSettings.contains("decimalPrecision")) {
        decimalPrecision = caseSettings["decimalPrecision"].toInt();
    }
    char numberFormat = defaultProfile["numberFormat"].toString("g").at(0).toLatin1();
    if (caseSettings.contains("numberFormat")) {
        numberFormat = caseSettings["numberFormat"].toString().at(0).toLatin1();
    }
    QString imaginaryUnit = defaultProfile["imaginaryUnit"].toString("j");
    if (caseSettings.contains("imaginaryUnit")) {
        imaginaryUnit = caseSettings["imaginaryUnit"].toString();
    }
    PhyxCalculator::OutputMode unitMode = (PhyxCalculator::OutputMode)defaultProfile["unitMode"].toInt(1);
    if (caseSettings.contains("unitMode")) {
        unitMode = (PhyxCalculator::OutputMode)caseSettings["unitMode"].toInt();
    }
    PhyxCalculator::PrefixMode prefixMode = (PhyxCalculator::PrefixMode)defaultProfile["prefixMode"].toInt(1);
    if (caseSettings.contains("prefixMode")) {
        prefixMode = (PhyxCalculator::PrefixMode)caseSettings["prefixMode"].toInt();
    }

    // Initialize unitloader symbols
    UnitLoader unitLoader;
    unitLoader.loadSymbols("PhyxCalc/settings/");

    // Initialize calculator
    PhyxCalculator calc;
    QString startupDefsPath = defaultProfile["startupDefinitions"].toString("PhyxCalc/settings/definitions.txt");
    calc.loadFile(startupDefsPath);

    CaseObserver observer(&calc);
    observer.decimalPrecision = decimalPrecision;
    observer.numberFormat = numberFormat;
    observer.imaginaryUnit = imaginaryUnit;
    observer.useFractions = useFractions;
    observer.unitMode = unitMode;
    observer.prefixMode = prefixMode;

    QJsonArray stepsArray;
    QJsonArray inputSteps = targetCase["steps"].toArray();

    for (int stepIdx = 0; stepIdx < inputSteps.size(); ++stepIdx) {
        if (targetStepIndex >= 0 && stepIdx > targetStepIndex) {
            break;
        }

        QJsonObject stepObj = inputSteps[stepIdx].toObject();
        QString input = stepObj["input"].toString();

        // Apply symbol replacements (greek symbols)
        if (unitLoader.symbols()) {
            for (int s = 0; s < unitLoader.symbols()->size(); ++s) {
                input.replace(unitLoader.symbols()->at(s).name, unitLoader.symbols()->at(s).symbol, Qt::CaseSensitive);
            }
        }

        observer.reset();
        calc.setExpression(input);
        if (!calc.expression().isEmpty()) {
            calc.evaluate();
        }

        if (targetStepIndex >= 0 && stepIdx < targetStepIndex) {
            continue; // Advance state without recording prior steps
        }

        QJsonObject recordedStep;
        recordedStep["input"] = stepObj["input"].toString();

        if (calc.hasError()) {
            recordedStep["kind"] = "error";
            recordedStep["display"] = calc.errorString();
            QJsonObject errObj;
            errObj["code"] = calculationErrorName(calc.errorNumber());
            errObj["errorNumber"] = calc.errorNumber();
            errObj["message"] = calc.errorString();
            errObj["startPosition"] = calc.errorStartPosition();
            errObj["endPosition"] = calc.errorEndPosition();
            recordedStep["error"] = errObj;
        } else if (observer.lastKind == "silent" || (calc.result() == NULL && observer.lastKind != "text")) {
            recordedStep["kind"] = "silent";
            recordedStep["display"] = "";
        } else if (observer.lastKind == "text") {
            recordedStep["kind"] = "display";
            recordedStep["display"] = observer.lastDisplay;
        } else if (observer.lastKind == "converted") {
            recordedStep["kind"] = "display";
            recordedStep["display"] = observer.lastDisplay;
            if (calc.result()) {
                QJsonObject rawVal;
                rawVal["real"] = QString::fromStdString(formatLongDouble(calc.resultValue().real()));
                rawVal["imaginary"] = QString::fromStdString(formatLongDouble(calc.resultValue().imag()));
                rawVal["unit"] = observer.convertedUnit;
                recordedStep["raw"] = rawVal;
            }
        } else { // "result"
            recordedStep["kind"] = "value";
            recordedStep["display"] = observer.lastDisplay;
            if (calc.result()) {
                QJsonObject rawVal;
                rawVal["real"] = QString::fromStdString(formatLongDouble(calc.resultValue().real()));
                rawVal["imaginary"] = QString::fromStdString(formatLongDouble(calc.resultValue().imag()));
                rawVal["unit"] = calc.resultUnit();
                recordedStep["raw"] = rawVal;
            }
        }

        stepsArray.append(recordedStep);
    }

    if (targetStepIndex >= 0) {
        if (!stepsArray.isEmpty()) {
            QJsonDocument outDoc(stepsArray[0].toObject());
            std::cout << outDoc.toJson(QJsonDocument::Indented).toStdString() << std::endl;
            return 0;
        } else {
            return 3;
        }
    }

    QJsonObject observation;
    observation["referenceBuild"] = "ubuntu-26.04-gcc15-qt5.15-qwt6.1";
    observation["platform"] = getPlatformInfo();

    QJsonObject effSettings;
    effSettings["decimalPrecision"] = decimalPrecision;
    effSettings["numberFormat"] = QString(numberFormat);
    effSettings["imaginaryUnit"] = imaginaryUnit;
    effSettings["unitMode"] = (int)unitMode;
    effSettings["prefixMode"] = (int)prefixMode;
    effSettings["useFractions"] = useFractions;
    observation["settings"] = effSettings;

    observation["steps"] = stepsArray;
    observation["date"] = "2026-11-04";

    QJsonDocument outDoc(observation);
    std::cout << outDoc.toJson(QJsonDocument::Indented).toStdString() << std::endl;

    return 0;
}

#include "runner.moc"
