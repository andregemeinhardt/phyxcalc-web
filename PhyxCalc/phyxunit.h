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

#ifndef PHYXUNIT_H
#define PHYXUNIT_H

#include <QObject>
#include <QMap>
#include "global.h"

class PhyxUnit : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString symbol READ symbol WRITE setSymbol)
    Q_PROPERTY(QString name READ name WRITE setName)
    //Q_PROPERTY(UnitType type READ type WRITE setType)
    Q_PROPERTY(PhyxFloatDataType offset READ offset WRITE setOffset)
    Q_PROPERTY(PhyxFloatDataType scaleFactor READ scaleFactor WRITE setScaleFactor)
    Q_PROPERTY(PowerMap *powers READ powers WRITE setPowers)
    //Q_PROPERTY(double prefixPower READ prefixPower WRITE setPrefixPower)
    Q_PROPERTY(UnitFlags flags READ flags WRITE setFlags)
    Q_PROPERTY(QString unitGroup READ unitGroup WRITE setUnitGroup)
    Q_PROPERTY(QString preferedPrefix READ preferedPrefix WRITE setPreferedPrefix)
    //Q_ENUMS(UnitType)
    Q_FLAGS(UnitFlag UnitFlags)

public:
    explicit PhyxUnit(QObject *parent = 0);
    ~PhyxUnit();

    /** Possible unit types */
    /*enum UnitType {
        DimensionlessUnitType,      /// DimensionlessUnits such as %,°,...
        ProductUnitType,            /// ProductUnits represented only by the exponents of their BaseUnits such as V,Ohm,...
        //OffsetUnitType,           /// OffsetUnits such as °C   (y = x + b)
        GalileanUnitType,           /// GalileanUnits such as °F (y = ax + b), also OffsetUnits such as °C (y = x + b) and ScaledUnits such as min ( y = ax)
        LogarithmicUnitType         /// LogarithmicUnits such as dB (y = a * log(x))
    };*/

    /** Flags for unit handling*/
    enum UnitFlag {
        SiUnitFlag = 0x01,              /// flag for Si-Units, needed to handle Si-Prefixes
        LogarithmicUnitFlag = 0x02,     /// flag for logarithmic units (dB)
        SystemUnitFlag = 0x04           /// flag for units that should be prefered over others (e.g. W > PS)
    };
    Q_DECLARE_FLAGS(UnitFlags, UnitFlag)

    typedef QMap<QString, PhyxFloatDataType> PowerMap;

    void powerAppend(QString base, PhyxFloatDataType power);        /// adds a power to the map
    void powerMultiply(QString base, PhyxFloatDataType factor);     /// multiplies a power with factor
    void powerDivide(QString base, PhyxFloatDataType factor);       /// devides a power with factor
    void powersMultiply(PowerMap *powers);                           /// multiplies powers of the unit with other powers
    void powersDivide(PowerMap *powers);                             /// devides powers of the unit with other powers
    void powersRaise(PhyxFloatDataType power);                      /// raises all powers to power
    void powersRoot(PhyxFloatDataType root);                        /// takes the root of all powers
    bool powersCompare(PowerMap *powers);                            /// compares powers of the unit with other powers and returns ==
    void powersClear();                                             /// clears all powers

    /*void prefixMultiply(double factor);
    void prefixDevide(double factor);
    void prefixRaise(double power);
    void prefixRoot(double root);*/

    bool isOne();                                       ///< returns wheter unit is 1 (no unit) or not
    bool isBaseUnit();                                  ///< returns wheter unit is a BaseUnit or not
    bool isDimensionlessUnit();                         ///< returns wheter unit is a DimensionlessUnit or not
    bool isProductUnit();                               ///< returns wheter unit is a ProductUnit or not
    bool isGalileanUnit();                              ///< returns wheter unit is a GalileanUnit or not

    bool isConvertible(PhyxUnit *unit);                 ///< checks wheter unit convertible to the other unit
    bool isSame(PhyxUnit *unit);                        ///< checks wheter unit is the same as the other unit

    static void copyUnit(PhyxUnit *source, PhyxUnit *destination);

    QString dimensionString() const;                    ///< returns a string with the dimensional representation of the unit (e.g. m^2*kg^-1)

    QString     symbol() const
    {
        return m_symbol;
    }
    QString     name() const
    {
        return m_name;
    }
    PhyxFloatDataType      offset() const
    {
        return m_offset;
    }
    PhyxFloatDataType      scaleFactor() const
    {
        return m_scaleFactor;
    }
    UnitFlags   flags() const
    {
        return m_flags;
    }
    PowerMap   *powers() const
    {
        return m_powers;
    }
    QString unitGroup() const
    {
        return m_unitGroup;
    }
    QString preferedPrefix() const
    {
        return m_preferedPrefix;
    }

private:
    QString     m_symbol;                  /// the symbol of the unit
    QString     m_name;                    /// the name of the unit
    PhyxFloatDataType      m_offset;       /// offset for OffsetUnit and GalileanUnit
    PhyxFloatDataType      m_scaleFactor;  /// scale factor for GalileanUnit and LogarithmicUnit
    PowerMap    *m_powers;                  /// this map holds the powers of the base units
    //double      m_prefixPower;             /// for Si units -> the power of the prefix (10^x)
    UnitFlags   m_flags;                   /// flags of the unit

    QString m_unitGroup;

    QString m_preferedPrefix;

signals:
    
public slots:

void setSymbol(QString arg)
{
    m_symbol = arg;
}
void setName(QString arg)
{
    m_name = arg;
}
void setOffset(PhyxFloatDataType arg)
{
    m_offset = arg;
}
void setScaleFactor(PhyxFloatDataType arg)
{
    m_scaleFactor = arg;
}
void setFlags(UnitFlags arg)
{
    m_flags = arg;
}
void setPowers(PowerMap *arg)
{
    m_powers->clear();
    for (int i = 0; i < arg->keys().size(); i++)
        m_powers->insert(arg->keys().at(i), arg->value(arg->keys().at(i)));
   // m_powers = arg;
}
void setUnitGroup(QString arg)
{
    m_unitGroup = arg;
}
void setPreferedPrefix(QString arg)
{
    m_preferedPrefix = arg;
}
};

#endif // PHYXUNIT_H
