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

#ifndef LINEPARSER_H
#define LINEPARSER_H

#include <QObject>
#include <QMap>
#include <QList>
#include <QDebug>
#include <QTextBlock>
#include <QTextEdit>
#include <QTableWidgetItem>
#include <QTableWidget>
#include <QListWidget>
#include <QCheckBox>
#include "unitloader.h"
#include "global.h"
#include "phyxcalculator.h"
#include "phyxsyntaxhighlighter.h"
#include "plotwindow.h"

class LineParser: public QObject
{
    Q_OBJECT
    Q_PROPERTY(QTextEdit *calculationEdit READ calculationEdit WRITE setCalculationEdit)
    Q_PROPERTY(QTableWidget *variableTable READ variableTable WRITE setVariableTable)
    Q_PROPERTY(QTableWidget *constantsTable READ constantsTable WRITE setConstantsTable)
    Q_PROPERTY(QTableWidget *unitsTable READ unitsTable WRITE setUnitsTable)
    Q_PROPERTY(QTableWidget *prefixesTable READ prefixesTable WRITE setPrefixesTable)
    Q_PROPERTY(QListWidget  *functionsList READ functionsList WRITE setFunctionsList)
    Q_PROPERTY(PlotWindow *plotWindow READ plotWindow WRITE setPlotWindow)
    Q_PROPERTY(AppSettings *appSettings READ appSettings WRITE setAppSettings)
    Q_PROPERTY(UnitLoader *unitLoader READ unitLoader WRITE setUnitLoader)
    Q_PROPERTY(PhyxCalculator *phyxCalculator READ phyxCalculator)
    Q_PROPERTY(PhyxSyntaxHighlighter *syntaxHighlighter READ syntaxHighlighter)
    Q_PROPERTY(bool loading READ isLoading WRITE setLoading)

public:
    explicit LineParser(QObject * = 0);
    ~LineParser();

    void parseLine(bool linebreak);
    void parseAll();
    void parseFromCurrentPosition();

    void insertNewLine(bool force = false);
    void deleteLine();
    bool resultLineSelected();
    bool commentLineSelected();

    void updateSettings();      ///< updates settings

    void appendLine(const QString &line);

    QString variableToolTip(QString name);
    QString constantToolTip(QString name);
    QString functionToolTip(QString name);

    QString exportFormelEditor();

    QTextEdit * calculationEdit() const
    {
        return m_calculationEdit;
    }
    QTableWidget * variableTable() const
    {
        return m_variableTable;
    }
    AppSettings * appSettings() const
    {
        return m_appSettings;
    }
    QTableWidget * constantsTable() const
    {
        return m_constantsTable;
    }
    UnitLoader * unitLoader() const
    {
        return m_unitLoader;
    }
    PhyxCalculator * phyxCalculator() const
    {
        return m_phyxCalculator;
    }
    PhyxSyntaxHighlighter * syntaxHighlighter() const
    {
        return m_syntaxHighlighter;
    }
    bool isLoading() const
    {
        return m_loading;
    }

    QTableWidget * unitsTable() const
    {
        return m_unitsTable;
    }

    QListWidget  * functionsList() const
    {
        return m_functionsList;
    }

    QTableWidget * prefixesTable() const
    {
        return m_prefixesTable;
    }

    PlotWindow * plotWindow() const
    {
        return m_plotWindow;
    }

private:
    QTextEdit       *m_calculationEdit;
    QTableWidget    *m_variableTable;
    QTableWidget    *m_constantsTable;
    AppSettings     *m_appSettings;
    UnitLoader      *m_unitLoader;
    PhyxCalculator  *m_phyxCalculator;
    PhyxSyntaxHighlighter * m_syntaxHighlighter;

    /* Replace greek letters written out with the symbols */
    void replaceSymbols();

    /* Text functions */
    void replaceCurrentLine(QString text);
    void insertOutput(QString text);
    QString getCurrentLine();

    /* si unit paser functions */
    QString removeWhitespace(QString string);
    /* Writes the expression with numbers and units instead of variables */
    QString replaceVariables(QString expression, bool insertValue = true, bool insertUnit = true);

    bool m_loading;

    QTableWidget * m_unitsTable;

    QListWidget  * m_functionsList;

    QTableWidget * m_prefixesTable;

    PlotWindow * m_plotWindow;

signals:
    void listWidgetUpdate(QListWidget*, QStringList);

public slots:
    void showVariables();
    void showConstants();
    void updateUnits();
    void updatePrefixes();
    void updateFunctions();
    void updateDatasets();
    void showPlotWindow();
    void clearAllVariables();
    void outputResult();
    void outputError();
    void outputText(QString text);
    void outputConverted(QString text);

    void setCalculationEdit(QTextEdit * arg)
    {
        m_calculationEdit = arg;
        m_syntaxHighlighter = new PhyxSyntaxHighlighter(m_calculationEdit->document());
    }
    void setVariableTable(QTableWidget * arg)
    {
        m_variableTable = arg;
    }
    void setAppSettings(AppSettings * arg)
    {
        m_appSettings = arg;
    }
    void setConstantsTable(QTableWidget * arg)
    {
        m_constantsTable = arg;
    }
    void setUnitLoader(UnitLoader * arg)
    {
        m_unitLoader = arg;
    }
    void setLoading(bool arg)
    {
        m_loading = arg;
        if (!arg)
            updateSettings();
    }
    void setUnitsTable(QTableWidget * arg)
    {
        m_unitsTable = arg;
    }
    void setFunctionsList(QListWidget  * arg)
    {
        m_functionsList = arg;
    }
    void setPrefixesTable(QTableWidget * arg)
    {
        m_prefixesTable = arg;
    }
    void setPlotWindow(PlotWindow * arg)
    {
        m_plotWindow = arg;
    }
};

#endif // LINEPARSER_H
