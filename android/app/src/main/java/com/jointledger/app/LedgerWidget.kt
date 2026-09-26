package com.jointledger.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

class LedgerWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
}

internal fun updateAppWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
) {
    val views = RemoteViews(context.packageName, R.layout.ledger_widget)

    // 1. Read the local storage file saved by Capacitor/React
    val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
    val currentBalance = prefs.getString("widget_balance", "$0.00")

    // 2. Set the balance text
    views.setTextViewText(R.id.balanceText, currentBalance)

    // 3. Setup the Deep Links for the Spend/Earn buttons
    val expenseIntent = Intent(Intent.ACTION_VIEW, Uri.parse("jointledger://app/expense")).apply { setPackage(context.packageName) }
    val expensePending = PendingIntent.getActivity(context, 1, expenseIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    val incomeIntent = Intent(Intent.ACTION_VIEW, Uri.parse("jointledger://app/income")).apply { setPackage(context.packageName) }
    val incomePending = PendingIntent.getActivity(context, 2, incomeIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    // 4. Setup clicking the Balance to open the app dashboard
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val launchPending = PendingIntent.getActivity(context, 3, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    views.setOnClickPendingIntent(R.id.btnExpense, expensePending)
    views.setOnClickPendingIntent(R.id.btnIncome, incomePending)
    views.setOnClickPendingIntent(R.id.balanceText, launchPending)

    // 5. Update the widget
    appWidgetManager.updateAppWidget(appWidgetId, views)
}