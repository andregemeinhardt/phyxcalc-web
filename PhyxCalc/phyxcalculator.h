/**************************************************************************
**
** This file is part of PhyxCalc.
**
** PhyxCalc is free software: you can redistribute it and/or modify
** it under the terms of the GNU General Public License as published by
** the Free Software Foundation, either version 3 of the License, or
** (at your option) any later version.
**
** PhyxCalc is distributed in the hope that it will be useful,
** but WITHOUT ANY WARRANTY; without even the implied warranty of
** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
** GNU General Public License for more details.
**
** You should have received a copy of the GNU General Public License
** along with PhyxCalc.  If not, see <http://www.gnu.org/licenses/>.
**
***************************************************************************/

#ifndef PHYXCALCULATOR_H
#define PHYXCALCULATOR_H

#define _USE_MATH_DEFINES

#include <QObject>
#include <QStack>
#include <QDateTime>
#include <QDebug>
#include <QFile>
#include <sstream>
#include <boost/format.hpp>
#include <boost/math/complex.hpp>
#include <boost/random/normal_distribution.hpp>
#include <boost/random/mersenne_twister.hpp>
#include <boost/random/variate_generator.hpp>
#include "qearleyparser.h"
#include "phyxunitsystem.h"
#include "phyxvariable.h"
#include "phyxvariablemanager.h"

#ifndef Q_OS_SYMBIAN
#include <boost/math/special_functions.hpp>
#endif

typedef std::complex<PhyxFloatDataType>   PhyxValueDataType;      /// the base data type for values

typedef struct {
    QStringList functions;                          /// a list of functions to call
} PhyxRule;

class PhyxCalculator : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString expression READ expression WRITE setExpression)
    Q_PROPERTY(bool error READ hasError)
    Q_PROPERTY(int errorNumber READ errorNumber)
    Q_PROPERTY(int errorStartPosition READ errorStartPosition)
    Q_PROPERTY(int errorEndPosition READ errorEndPosition)
    Q_PROPERTY(PhyxValueDataType resultValue READ resultValue)
    Q_PROPERTY(QString resultUnit READ resultUnit)
    Q_PROPERTY(PhyxVariable * result READ result)

public:
    explicit PhyxCalculator(QObject *parent = 0);

    enum CalculationError {
        SyntaxError,
        UnitsNotConvertibleError,
        UnitNotDimensionlessError,
        ValueNotPositiveError,
        ValueNotIntegerError,
        ValueComplexError,
        StringNotValidError,
        PrefixError,
        UnknownVariableError,
        ProgramError
    };

    enum OutputMode {
        OnlyBaseUnitsOutputMode   = 0x03,         /// option to convert output units into base units
        MinimizeUnitOutputMode    = 0x01,         /// option to use shortest possible output unit, but use input units in case of ambiguity
        ForceInputUnitsOutputMode = 0x02          /// option to use only input units as output unit, as far as possible
    };

    enum PrefixMode {
        UsePrefix   = 0x01,
        UseNoPrefix = 0x02
    };

    enum InputOutputFlags {
        InputOnlyFlag   = 0x01                  /// option used for units and prefix which should be used for input only (like da or PS)
    };

    enum LowLevelOperationType {
        AssignmentOperation            = 0x01,
        AssignmentRemoveOperation      = 0x02,
        CombinedAssignmentOperationAdd = 0x03,
        CombinedAssignmentOperationSub = 0x04,
        CombinedAssignmentOperationMul = 0x05,
        CombinedAssignmentOperationDiv = 0x06,
        CombinedAssignmentOperationMod = 0x07,
        CombinedAssignmentOperationAnd = 0x08,
        CombinedAssignmentOperationOr  = 0x09,
        CombinedAssignmentOperationXor = 0x10,
        CombinedAssignmentOperationShiftLeft  = 0x11,
        CombinedAssignmentOperationShiftRight = 0x12,
        OutputOperation                = 0x13
    };

    enum ListOperationType {
        ListAddType,
        ListSubType,
        ListMulType,
        ListDivType,
        ListModType,
        ListPowType,
        ListBOrType,
        ListBAndType,
        ListBXorType,
        ListXandType,
        ListAndType,
        ListNandType,
        ListXorType,
        ListOrType,
        ListNorType
    };

    typedef struct {
        QStringList functionList;
        QString expression;
        QList<int>  startPosList;
        QList<int>  endPosList;

        QString const function(int pos) {
            return functionList.at(pos);
        }
        QString const parameter(int pos) {
            return expression.mid(startPosList.at(pos), endPosList.at(pos) - startPosList.at(pos) + 1);
        }
        void appendItem(QString function, int startPos, int endPos) {
            functionList.append(function);
            startPosList.append(startPos);
            endPosList.append(endPos);
        }
        int size() {
            return functionList.size();
        }
    } ExpressionCacheItem;

    typedef struct {
      PhyxFloatDataType numerator;
      PhyxFloatDataType denominator;
    } PhyxFraction;

    typedef struct {
        QString value;
        QString unit;
    } ResultVariable;   /// this struct is for outputting the formated variable

    typedef struct {
        QString                 variableName;
        LowLevelOperationType   type;
        PhyxVariable            *variable;
    } LowLevelOperation;

    typedef QList<LowLevelOperation*>    LowLevelOperationList;

    bool setExpression (QString m_expression);          ///< sets the expression, checks what must be parsed and returns wheter the expression is parsable or not
    bool evaluate();
    bool evaluate(QList<EarleyTreeItem> earleyTree, const QString expression, const QList<int> whiteSpaceList);                                    ///< evaluates the expression
    bool evaluate(ExpressionCacheItem cacheItem, const QList<int> whiteSpaceList);
    void loadFile(QString fileName);                    ///< parses a complete txt file

    PhyxVariable * variable(QString name) const;
    PhyxVariable * constant(QString name) const;
    PhyxUnit     * unit(QString symbol) const;
    PhyxUnitSystem::PhyxPrefix prefix(QString symbol, QString unitGroup) const;
    PhyxVariableManager::PhyxFunction * function(QString name) const;
    PhyxVariableManager::PhyxDataset * dataset(int index) const;
    PhyxVariableManager::PhyxVariableMap * variables() const;
    PhyxVariableManager::PhyxVariableMap * constants() const;
    PhyxUnitSystem::PhyxUnitMap units() const;
    QList<PhyxUnitSystem::PhyxPrefix> prefixes() const;
    QStringList functions() const;
    PhyxVariableManager::PhyxDatasetList * datasets() const;
    QString expression() const
    {
        return m_expression;
    }
    bool hasError() const
    {
        return m_error;
    }
    int errorNumber() const
    {
        return m_errorNumber;
    }
    QString errorString() const;
    PhyxValueDataType resultValue() const
    {
        return m_resultValue;
    }
    QString resultUnit() const
    {
        return m_resultUnit;
    }
    int errorStartPosition() const
    {
        return m_errorStartPosition;
    }
    int errorEndPosition() const
    {
        return m_errorEndPosition;
    }
    PhyxVariable * result() const
    {
        return m_result;
    }

    static QString complexToString(const PhyxValueDataType number, int precision, char numberFormat, QString imaginaryUnit, bool useBraces = false, bool useFractions = false);
    static PhyxValueDataType stringToComplex(QString string);
    static PhyxIntegerDataType hexToLongInt(QString string);
    static PhyxIntegerDataType octToLongInt(QString string);
    static PhyxIntegerDataType binToLongInt(QString string);
    static PhyxIntegerDataType bcdToLongInt(PhyxIntegerDataType number);
    static QString longIntToHex(PhyxIntegerDataType number);
    static QString longIntToOct(PhyxIntegerDataType number);
    static QString longIntToBin(PhyxIntegerDataType number);
    static PhyxIntegerDataType longIntToBcd(PhyxIntegerDataType number);
    static PhyxIntegerDataType gcd(PhyxIntegerDataType x, PhyxIntegerDataType y);  ///< returns the greatest common divisor of x and y
    static PhyxIntegerDataType lcm(PhyxIntegerDataType x, PhyxIntegerDataType y);  ///< returns the lowest common multiple of x and y
    static PhyxFloatDataType toInt(PhyxFloatDataType x);
    static PhyxFraction decimalToFraction(PhyxFloatDataType decimal, PhyxFloatDataType accuracyFactor);

    ResultVariable formatVariable(PhyxVariable *variable, OutputMode outputMode, PrefixMode prefixMode, int precision, char numberFormat, QString imaginaryUnit, bool useFractions) const;

private:
    QStack<PhyxVariable*>       variableStack;                                  /// stack for variable calculation
    QStack<LowLevelOperationList*> lowLevelStack;                               /// stack for low level operations
    QStack<QString>             functionParameterStack;                         /// stack for storing paramters for function definition
    QList<PhyxVariable*>        variableList;                                   /// list containing currently loaded variables
    QString                     parameterBuffer;                                /// string for buffering numbers
    QString                     stringBuffer;                                   /// string for buffering strings
    PhyxValueDataType           valueBuffer;
    QString                     prefixBuffer;
    QString                     unitBuffer;
    QString                     unitGroupBuffer;
    QString                     nameBuffer;
    QString                     expressionBuffer;
    int                         flagBuffer;                                     /// this buffer holds current set flags (e.g. the inputOnly flag
    int                         stackLevel;                                     /// this variable holds the current stack level, 0 = lowest

    QHash<QString, PhyxRule>    phyxRules;                                      /// map of all rules, key is rule

    QEarleyParser               *earleyParser;                                  /// the earley parser
    PhyxUnitSystem              *unitSystem;                                    /// the unit system
    PhyxVariableManager         *variableManager;                               /// the variable manager

    QList<int>                  expressionWhitespaceList;                       /// this list holds count of removed whitespace for each character of the expression

    bool                        listModeActive;                                 /// holds whete list mode is active or not
    ListOperationType           listModeType;                                   /// holds current list operation type

    bool                        noGuiUpdate;                                    /// if this variable is set, no GUI update should be performed (e.g. when running functions)

    QString                     m_expression;                                   /// currently set expression
    bool                        expressionIsParsable;                           /// holds wheter currently set expression is parsable or not
    PhyxValueDataType           m_resultValue;                                  /// value of the result
    QString                     m_resultUnit;                                   /// unit symbol of the result
    PhyxVariable                *m_result;                                      /// result as variable
    bool                        m_error;                                        /// holds wheter an error occured or not
    int                         m_errorNumber;                                  /// current error number
    int                         m_errorStartPosition;                           /// position where the error occured
    int                         m_errorEndPosition;                             /// end position of the error


    QHash<QString, void (PhyxCalculator::*)()> functionMap;                     /// functions mapped with their names
    QMap<QString, ExpressionCacheItem > expressionCacheMap;                   /// a cache for faster execution of expressions
    QStringList                 standardFunctionList;                           /// a stringlist containing all standard function names

    ExpressionCacheItem const earleyTreeToCacheItem(QList<EarleyTreeItem> const earleyTree, const QString expression);

    void initialize();                                                          ///< initializes PhyxCalculator
    void loadGrammar(QString fileName);                                         ///< loads the grammar from a file
    QString stripComments(QString text);                                        ///< strips all comments from the text
    QString removeWhitespace(QString text, QList<int> *whiteSpaceList);         ///< removes the whitespace of a string and saves the count
    int restoreErrorPosition(int pos, QList<int> whiteSpaceList);               ///< restores the original position of an error in expression

    void raiseException(int errorNumber);                                       ///< raises an exception
    void addRule(QString rule, QString functions = "");                         ///< adds a rule

    PhyxUnitSystem::PhyxPrefix getBestPrefix(PhyxFloatDataType value, PhyxFloatDataType power, QString unitGroup, QString preferedPrefix) const;     ///< gets the best fitting prefix

    void clearStack();
    void clearResult();

    void clearFlags();

    bool popVariables(int count);                       /// checks wheter enough variables are in the stack and loads them
    void pushVariables(int count, int deleteCount);     /// push the given number of variables to the stack and delete the given number

    /** functions for value calculation */
    void valueCheckComplex();
    void valueCheckComplex2();
    void valueCheckComplex3();
    void valueCheckComplex2th();
    void valueCheckComplex3th();
    void valueCheckPositive();
    void valueCheckInteger();       ///< checks wheter the last argument is an integer or not
    void valueCheckInteger2();      ///< checks wheter the last 2 arguments are integer or not
    void valueCheckInteger2th();    ///< checks wheter the second argument is an integer or not
    void valueCheckInteger3th();    ///< checks wheter the third argument is an integer or not
    void valuePush1();
    void valuePush2();
    void valuePush3();
    void valueCopy();
    void valueAdd();
    void valueSub();
    void valueMul();
    void valueDiv();
    void valueMod();
    void valueNeg();
    void valueNoPow();
    void valuePow();
    void valueSin();
    void valueArcsin();
    void valueCos();
    void valueArccos();
    void valueTan();
    void valueArctan();
    void valueCot();
    void valueArccot();
    void valueSec();
    void valueArcsec();
    void valueCsc();
    void valueArccsc();
    void valueSinh();
    void valueArcsinh();
    void valueCosh();
    void valueArccosh();
    void valueTanh();
    void valueArctanh();
    void valueCoth();
    void valueArccoth();
    void valueSech();
    void valueArcsech();
    void valueCsch();
    void valueArccsch();
    void valueExp();
    void valueLn();
    void valueLog10();
    void valueLog2();
    void valueLogn();
    void valueRoot();
    void valueSqrt();
    void valueAbs();
    void valueMax();
    void valueMin();
    void valueAvg();
    void valuePi();
    void valueE();
    void valueInt();
    void valueTrunc();
    void valueFloor();
    void valueRound();
    void valueCeil();
    void valueSign();
    void valueHeaviside();
    void valueRand();
    void valueRandint();
    void valueRandg();
    void valueFaculty();
    void valueBcd();
    void valueToBcd();
    void valueAns();
    void valueGcd();
    void valueLcm();

    void complexReal();
    void complexImag();
    void complexArg();
    void complexNorm();
    void complexConj();
    void complexPolar();

    void logicAnd();
    void logicOr();
    void logicNand();
    void logicNor();
    void logicXand();
    void logicXor();
    void logicNot();
    void logicEqual();
    void logicNotEqual();
    void logicGreater();
    void logicGreaterOrEqual();
    void logicSmaller();
    void logicSmallerOrEqual();

    void bitAnd();
    void bitOr();
    void bitXor();
    void bitInv();
    void bitShiftLeft();
    void bitShiftRight();

    void conditionIfElse();

    /** functions for unit calculation */
    void unitCheckDimensionless();
    void unitCheckDimensionless2();
    void unitCheckDimensionless2th();
    void unitCheckDimensionless3th();
    void unitCheckConvertible();
    void unitConvert();
    void unitMul();
    void unitDiv();
    void unitPow();
    void unitRoot();
    void unitSqrt();
    void unitClear();
    void unitAdd();
    void unitRemove();

    /** functions for variable handling */
    void variableAdd();
    void variableRemove();
    void variableLoad();
    void variablePreInc();
    void variablePreDec();
    void variablePostInc();
    void variablePostDec();
    void constantAdd();
    void constantRemove();
    void constantLoad();

    /** function for list operations */
    void listAddStart();
    void listSubStart();
    void listMulStart();
    void listDivStart();
    void listModStart();
    void listPowStart();
    void listBOrStart();
    void listBAndStart();
    void listBXorStart();
    void listXandStart();
    void listAndStart();
    void listNandStart();
    void listXorStart();
    void listOrStart();
    void listNorStart();
    void listValueSave();
    void listValueLoad();
    void listValueSwap();
    void listEnd();

    /** functions for function handling */
    bool executeFunction(QString expression, QStringList parameters, bool verifyOnly);
    void functionAdd();
    void functionRemove();
    void functionRun();

    /** functions for buffering */
    void bufferUnit();
    void bufferValue();
    void bufferHex();
    void bufferOct();
    void bufferBin();
    void bufferHexString();
    void bufferOctString();
    void bufferBinString();
    void bufferPrefix();
    void bufferString();
    void bufferExpression();
    void bufferUnitGroup();
    void pushVariable();
    void pushFunctionParameter();

    /** flag functions */
    void setInputOnlyFlag();

    /** output functions*/
    void outputVariable();
    void outputString();
    void outputConvertedUnit();

    /** special functions */
    void unitGroupAdd();
    void unitGroupRemove();
    void prefixAdd();
    void prefixRemove();

    /** low level functions */
    void appendLowLevelOperation(QString variableName, LowLevelOperationType type, PhyxVariable *variable);
    void runLowLevelOperation(LowLevelOperation *operation);
    void lowLevelAdd();
    void lowLevelRun();
    void lowLevelAssignment();
    void lowLevelAssignmentRemove();
    void lowLevelCombinedAssignmentAdd();
    void lowLevelCombinedAssignmentSub();
    void lowLevelCombinedAssignmentMul();
    void lowLevelCombinedAssignmentDiv();
    void lowLevelCombinedAssignmentMod();
    void lowLevelCombinedAssignmentAnd();
    void lowLevelCombinedAssignmentOr();
    void lowLevelCombinedAssignmentXor();
    void lowLevelCombinedAssignmentShiftLeft();
    void lowLevelCombinedAssignmentShiftRight();
    void lowLevelOutput();

    void calculateDataset(QString expression,
                          QStringList parameters,
                          PhyxVariable *startVariable,
                          PhyxFloatDataType stop,
                          PhyxFloatDataType step,
                          PhyxVariableManager::DatasetType datasetType);
    void datasetCreateStep();
    void datasetCreate();
    void datasetLogCreateStep();
    void datasetLogCreate();

signals:
    void variablesChanged();        ///< is emited when variables have changed
    void constantsChanged();        ///< is emited when constants have changed
    void unitsChanged();            ///< is emited when units have changed
    void prefixesChanged();         ///< is emited when prefixes have changed
    void functionsChanged();        ///< is emited when functions have changed
    void datasetsChanged();         ///< is emited when datasets have changed
    void outputResult();            ///< is emited when result should be output
    void outputError();             ///< is emited when an error should be output
    void outputText(QString text);  ///< is emited when text should be output
    void outputConverted(QString text); ///< is emited when a converted unit should be output
    void outputTable();
    void outputPlot();
    
public slots:
    void clearVariables();

private slots:
    void addUnitRule(QString symbol);
    void removeUnitRule(QString symbol);
    void addVariableRule(QString name);
    void removeVariableRule(QString name);
    void addConstantRule(QString name);
    void removeConstantRule(QString name);
    void addPrefixRule(QString symbol);
    void removePrefixRule(QString symbol);
    void addUnitGroupRule(QString name);
    void removeUnitGroupRule(QString name);
    void addFunctionRule(QString name, int parameterCount);
    void removeFunctionRule(QString name, int parameterCount);
};

#endif // PHYXCALCULATOR_H
