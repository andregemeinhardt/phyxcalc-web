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
#ifndef PLOTDIALOG_H
#define PLOTDIALOG_H

#include <QDialog>

namespace Ui {
class PlotDialog;
}

class PlotDialog : public QDialog
{
    Q_OBJECT
    Q_PROPERTY(QString output READ output)
    
public:
    explicit PlotDialog(QWidget *parent = 0);
    ~PlotDialog();

    void setExpression(QString const expression);
    
    QString output() const
    {
        return m_output;
    }

private slots:
    void updateOutput();

    void on_linearRadio_clicked();

    void on_logRadio_clicked();

private:
    Ui::PlotDialog *ui;
    QString m_output;
};

#endif // PLOTDIALOG_H
