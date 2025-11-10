' קוד ייחוס מ-Access - יצירת קובץ מס"ב
' קובץ זה משמש כעיון בלבד ולא מיועד להרצה

' ===============================================
' פונקציה ראשית - יצירת קובץ מס"ב
' ===============================================
Sub CreateMasavFile()
    ' ... (הקוד המלא שהעתקת)
End Sub

' ===============================================
' פונקציות עזר
' ===============================================

' מילוי מחרוזת באפסים או רווחים
Public Function PadString(strText As String, intRequiredSize As Integer, strFiller As String, Optional blnPadTrailing As Boolean = True) As String
    PadString = strText
    If Len(strText) < intRequiredSize Then
        If Not blnPadTrailing Then
            PadString = String(intRequiredSize - Len(strText), strFiller) & PadString
        Else
            PadString = PadString & String(intRequiredSize - Len(strText), strFiller)
        End If
    End If
End Function

' בדיקת קיום קובץ
Public Function FileFolderExists(strFullPath As String) As Boolean
    On Error GoTo EarlyExit
    If Not Dir(strFullPath, vbDirectory) = vbNullString Then FileFolderExists = True
EarlyExit:
    On Error GoTo 0
End Function

' כתיבת קובץ טקסט
Function WriteFile(TextFileName As String, TextToWrite As String)
    Dim intNum As Integer
    intNum = FreeFile
    Open TextFileName For Output As intNum
    Print #1, TextToWrite
    Close intNum
    Debug.Print "Wrote file " & TextFileName
End Function

' פירוק שמות עבריים
Function ParseJewishNames(SourceString As String) As String
    ' ... (הקוד המלא)
End Function

' ===============================================
' תובנות חשובות מהקוד:
' ===============================================
' 1. מספר אסמכתא = ClientID (מזהה הלקוח)
' 2. סכום מוכפל ב-100 (המרה לאגורות)
' 3. שם לקוח מהופך (StrReverse) בגלל עברית RTL
' 4. סוג תנועה 504 = חיוב רגיל
' 5. לאחר יצירת קובץ: העברה לארכיון + מחיקת רשומות
' 6. שם קובץ: Msv[dd-mm-yy].001
' 7. ולידציות: ת.ז, פרטי בנק, סכום > 0
