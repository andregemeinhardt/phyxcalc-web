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

#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QList>
#include <QSettings>
#include <QEvent>
#include <QKeyEvent>
#include <QMessageBox>
#include <QFileDialog>
#include <QListWidget>
#include <QToolButton>
#include <QToolTip>
#include <QTextLayout>
#include <QVariant>
#include "lineparser.h"
#include "unitloader.h"
#include "exportdialog.h"
#include "helpdialog.h"
//#include "flowlayout.h"
#include "settingsdialog.h"
#include "plotwindow.h"
#include "plotdialog.h"
#include "global.h"

typedef struct {
    QString     name;
    QString     path;
    LineParser  *lineParser;
    QTextEdit   *expressionEdit;
} Document;

namespace Ui {
    class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    enum ScreenOrientation {
        ScreenOrientationLockPortrait,
        ScreenOrientationLockLandscape,
        ScreenOrientationAuto
    };

    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

    // Note that this will only have an effect on Symbian and Fremantle.
    void setOrientation(ScreenOrientation orientation);
    void showExpanded();

protected:
    bool eventFilter(QObject *obj, QEvent *event);
    void closeEvent(QCloseEvent *event);

private:
    Ui::MainWindow  *ui;
    QAction *configureAction;           /// configure action for slim mode

    PlotWindow *plotWindow;

    QList<Document*> documentList;
    UnitLoader      *unitLoader;
    int             activeTab;
    AppSettings     appSettings;
    QStringList     recentDocuments;

    QString settingsDir;                /// the directory in which the settigs are stored
    QString autosaveFilename;           /// the name of the file used for autosaves

    void addNewTab();

    void copyResource(QString name);        ///< copies the resource in the settings folder
    void firstStartConfig();                ///< copies all resources to the settings folder on first startup
    void loadSettings();
    void saveSettings();
    bool saveDocument(Document *document, bool force = false, bool exit = false);
    void openDocument(QString fileName, bool newTab = true);
    void restoreDocument();
    void deleteAutosaves();
    void syncDocumentTitle();

    void loadAllDocks();
    void loadDock(const QString &name, const QStringList & items);

    void updateRecentDocuments();
    void addRecentDocument(QString name);

    void initializeGUI();

    void switchLayout(int number);          ///< switches the Layout, 0 = normal, 1 = slim

private slots:
    void tabChanged(int index);
    bool closeTab(int index);
    bool closeAllTabs();

    void documentModified();
    void autosaveDocument();

    void loadListWidget(QListWidget *listWidget, const QStringList &items);
    void dockButtonPressed(QAbstractButton *button);
    void dockWidgetPressed(QListWidgetItem *item);

    void showContexMenu(const QPoint &point);
    void showPlotDialog();

    void openRecentDocument();

    void on_actionNew_Tab_triggered();
    void on_actionExport_triggered();
    void on_actionSave_triggered();
    void on_actionSave_As_triggered();
    void on_actionOpen_triggered();
    void on_actionClose_triggered();
    void on_actionUndo_triggered();
    void on_actionRedo_triggered();
    void on_actionSave_All_triggered();
    void on_actionSettings_triggered();
    void on_actionAbout_triggered();
    void on_actionCut_triggered();
    void on_actionCopy_triggered();
    void on_actionPaste_triggered();
    void on_actionClose_Other_triggered();
    void on_actionRecalculate_All_triggered();
    void on_actionRecalculate_from_Line_triggered();
    void on_action_Slim_Mode_triggered();
    void on_actionClear_Variables_triggered();
    void on_actionHelp_triggered();
    void on_action_Plot_Window_triggered(bool checked);
};

#endif // MAINWINDOW_H
