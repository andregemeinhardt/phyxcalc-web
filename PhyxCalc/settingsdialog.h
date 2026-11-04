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

#ifndef SETTINGSDIALOG_H
#define SETTINGSDIALOG_H

#include <QDialog>
#include <QColorDialog>
#include <QListWidgetItem>
#include <QDir>
#include <QDesktopServices>
#include <QUrl>
#include "global.h"

namespace Ui {
    class SettingsDialog;
}

class SettingsDialog : public QDialog
{
    Q_OBJECT
    Q_PROPERTY(QString settingsDir READ settingsDir WRITE setSettingsDir)

public:
    explicit SettingsDialog(QWidget *parent = 0);
    ~SettingsDialog();

    void setAppSettings(AppSettings *settings);
    void getAppSettings(AppSettings *settings);

    QString settingsDir() const
    {
        return m_settingsDir;
    }

public slots:
    void setSettingsDir(QString arg)
    {
        m_settingsDir = arg;
    }

private slots:
    void openSettingsDir();

    void on_listWidget_currentRowChanged(int currentRow);

    void on_formatRadioCustom_toggled(bool checked);

    void on_colorSchemeForegroundButton_clicked();

    void on_colorSchemeBackgroundButton_clicked();

    void on_colorSchemeDeleteForegroundButton_clicked();

    void on_colorSchemeDeleteBackgroundButton_clicked();

    void on_colorSchemeBoldCheck_clicked(bool checked);

    void on_colorSchemeItalicCheck_clicked(bool checked);

    void on_colorSchemeList_currentItemChanged(QListWidgetItem *current, QListWidgetItem *);

    void on_fontCombo_currentFontChanged(const QFont &f);

private:
    Ui::SettingsDialog *ui;

    void setColorSchemeForeground(QColor color);
    void setColorSchemeBackground(QColor color);
    void setColorSchemeBold(bool bold);
    void setColorSchemeItalic(bool italic);
    QString m_settingsDir;
};

#endif // SETTINGSDIALOG_H
