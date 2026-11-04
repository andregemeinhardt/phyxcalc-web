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
#ifndef HELPDIALOG_H
#define HELPDIALOG_H

#include <QDialog>
#include <QFile>

namespace Ui {
class HelpDialog;
}

class HelpDialog : public QDialog
{
    Q_OBJECT
    
public:
    explicit HelpDialog(QWidget *parent = 0);
    void setHelpFile(QString fileName);
    ~HelpDialog();
    
private:
    Ui::HelpDialog *ui;
};

#endif // HELPDIALOG_H
