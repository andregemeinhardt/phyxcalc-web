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

#ifndef GLOBAL_H
#define GLOBAL_H

#define VERSION_MAJOR "3rev"
#define VERSION_REV "$Rev$"
#define LAST_CHANGE __DATE__ " " __TIME__
#define MATH_OPERATORS "[+\\-\\*/\\(\\)<>!\\^=]"

#if defined(Q_OS_SYMBIAN) || defined(Q_OS_ANDROID) || defined(Q_WS_SIMULATOR) || defined(Q_WS_MAEMO_5)
#define MOBILE_VERSION
#endif

#include <QFont>
#include <QColor>
#include <QList>

#ifdef Q_OS_ANDROID
#define _BIG_ENDIAN
#endif

#ifndef Q_OS_SYMBIAN
#define PHYX_FLOAT_NULL 0.0L
#define PHYX_FLOAT_ONE 1.0L
#define PHYX_FLOAT_TWO 2.0L
#define PHYX_FLOAT_THREE 3.0L
#define PHYX_FLOAT_TEN 10.0L
#define PHYX_FLOAT_THOUSAND 1000.0L
#define FRACTION_MAX 1.0e-19L
#define FRACTION_MIN 1.0e+19L
#define FRACTION_BIGGEST 999999999999999999.0L
typedef long double                 PhyxFloatDataType;      /// the data type for floating point variables
#else
#define PHYX_FLOAT_NULL 0.0
#define PHYX_FLOAT_ONE 1.0
#define PHYX_FLOAT_TWO 2.0
#define PHYX_FLOAT_THREE 3.0
#define PHYX_FLOAT_TEN 10.0
#define PHYX_FLOAT_THOUSAND 1000.0
#define FRACTION_MAX 1.0e-19
#define FRACTION_MIN 1.0e+19
#define FRACTION_BIGGEST 999999999999999999.0
typedef double                      PhyxFloatDataType;      /// the data type for floating point variables
#endif
typedef long int                    PhyxIntegerDataType;    /// the data type for integers

//structure for colorScheme Items
typedef struct {
    QColor  foregroundColor;
    QColor  backgroundColor;
    bool    bold;
    bool    italic;
} colorSchemeItem;

typedef struct {
    struct {
        struct {
            int decimalPrecision;
            char format;
            bool useFractions;
        } numbers;
        int unitMode;
        QString imaginaryUnit;
        int prefixMode;
    } output;
    struct {
        struct {
            bool outputWithNumbers;
            bool outputResult;
        } expression;
    } lineParser;
    struct {
        QFont font;
        bool useSyntaxHighlighter;
        QList<colorSchemeItem> colorScheme;
    } textEditor;
    struct {
        bool autoShowPlotWindow;
    } plot;
} AppSettings;

#endif // GLOBAL_H
