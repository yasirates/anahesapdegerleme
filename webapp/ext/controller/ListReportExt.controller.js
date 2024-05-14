sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  'sap/m/MessageItem',
  'sap/m/MessageView',
  "sap/ui/core/IconPool"
], function (JSONModel, MessageToast, MessageItem, MessageView, IconPool) {
  'use strict';

  return {

    onInit: function () {
      var oViewModel = new JSONModel({
      });
      this.getView().setModel(oViewModel, "viewModel");
      this.oViewModel = this.getView().getModel("viewModel");
      this._createMessageDialog();
    },

    onAfterRendering: function () {
      // debugger;
      // var tblId = "com.ntt.anahesapdegerleme3::sap.suite.ui.generic.template.ListReport.view.ListReport::AnaHesapDegerlemeProg--listReport";
      // const oTable = this.getView().byId(tblId);
      // const oTableModel = this.getView().byId(tblId).getModel();

      // oTable.setEnableAutoColumnWidth(false);
      // oTableModel.attachRequestCompleted((oEvent) => {
      //   setTimeout(() => {
      //     // oTable.setEnableAutoColumnWidth(true);
      //     // const aColumns = oTable.getTable().getColumns();
      //     // for (let i = aColumns.length - 1; i > -1; i--) {
      //     //   aColumns[i].getParent().autoResizeColumn(i);
      //     // }
      //   });
      // });
    },

    onMuhasebelestir: function (oEvent) {
      const selectedItems = this.getSelectedItems();
      if (!selectedItems || selectedItems.length === 0) {
        MessageToast.show(this.getResourceBundle().getText("selectedItemError"));
        return;
      }

      var itemIsExist = selectedItems.find(q => q.belnr !== "");
      if (itemIsExist) {
        MessageToast.show(this.getResourceBundle().getText("Daha önce muhasebeleştirilmiş kayıtlar mevcut."));
        return;
      }

      var that = this;
      sap.m.MessageBox.confirm("İşleminize devam etmek istiyor musunuz?", {
        actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CLOSE],
        onClose: function (sAction) {
          if (sAction === "OK") {
            that.getView().setBusy(true);
            var errorList = [];
            that.muhasebelestir(selectedItems, 0, errorList);
          }
        }
      });
    },

    muhasebelestir: function (selectedItems, index, errorList) {
      var that = this;
      if (selectedItems.length > index) {
        var selectedItem = selectedItems[index];
        var documentReferenceID = new Date().getTime();
        var soapMessage = this.getCreateJournalEntrySoapM(selectedItem, documentReferenceID);
        this.createJournalEntry(soapMessage, selectedItem.uuid, "01",
          function (response) {
            // errorList.push({
            //   type: that._getMessageType("1"),
            //   title: selectedItem.dmbtr + " tutarındaki kayıt aktarıldı.",
            //   description: selectedItem.dmbtr + " tutarındaki kayıt aktarıldı.",
            //   subtitle: "",
            //   counter: 1
            // });
            debugger;
            var serviceReqResult = that.responseTersKayitParse(response);
            var code = "";
            var message = "";
            if (serviceReqResult.accountingDocument !== "0000000000") {
              code = "1"
              message = selectedItem.correct_balance + " tutarındaki kayıt aktarıldı. ";
            } else {
              code = "3"
              message = selectedItem.correct_balance + " tutarındaki kayıt aktarılamadı! ";
            }
            serviceReqResult.logs.forEach(function myFunction(item) {
              errorList.push({
                type: that._getMessageType(code),
                title: message + item.note,
                description: message + item.note,
                subtitle: "",
                counter: 1
              });
            });
          },
          function (response) {
            errorList.push({
              type: that._getMessageType("3"),
              title: selectedItem.dmbtr + " tutarındaki kayıtta hata alındı.",
              description: selectedItem.dmbtr + " tutarındaki kayıtta hata alındı.",
              subtitle: "",
              counter: 1
            });
          },
          function (response) {
            index++;
            that.muhasebelestir(selectedItems, index, errorList);
          });
      } else {
        this.getView().setBusy(false);
        this.extensionAPI.rebindTable();
        this.oViewModel.setProperty("/errorList", errorList);
        this.oErrorDialog.open();
        if (this.oMessageView) {
          this.oMessageView.navigateBack();
        }
      }
    },

    onTersKayitAl: function (oEvent) {
      const selectedItems = this.getSelectedItems();
      if (!selectedItems || selectedItems.length === 0) {
        MessageToast.show(this.getResourceBundle().getText("selectedItemError"));
        return;
      }

      var itemIsExist = selectedItems.find(q => q.rev_belnr !== "");
      if (itemIsExist) {
        MessageToast.show(this.getResourceBundle().getText("Daha önce ters kayıt alınmıştır."));
        return;
      }

      var that = this;
      sap.m.MessageBox.confirm("İşleminize devam etmek istiyor musunuz?", {
        actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CLOSE],
        onClose: function (sAction) {
          if (sAction === "OK") {
            debugger;
            that.getView().setBusy(true);
            var errorList = [];
            that.tersKayitAl(selectedItems, 0, errorList);
          }
        }
      });
    },

    tersKayitAl: function (selectedItems, index, errorList) {
      debugger;
      var that = this;
      if (selectedItems.length > index) {
        var selectedItem = selectedItems[index];
        var soapMessage = this.getTersKayitAlSoapM(selectedItem);
        this.createJournalEntry(soapMessage, selectedItem.uuid, "02",
          function (response) {
            debugger;
            var serviceReqResult = that.responseTersKayitParse(response);
            var errorCode = "";
            var errorMessage = "";
            if (serviceReqResult.accountingDocument !== "0000000000") {
              errorCode = "1"
              errorMessage = selectedItem.belnr + " nolu belge için, " + serviceReqResult.accountingDocument + " nolu belge oluşturuldu. ";
            } else {
              errorCode = "3"
              errorMessage = selectedItem.belnr + " nolu belge için ters kayıt atılamadı! "
            }
            serviceReqResult.logs.forEach(function myFunction(item) {
              errorList.push({
                type: that._getMessageType(errorCode),
                title: errorMessage + item.note,
                description: errorMessage + item.note,
                subtitle: "",
                counter: 1
              });
            });
          },
          function (response) {
            errorList.push({
              type: that._getMessageType("3"),
              title: selectedItem.belnr + " nolu belge için ters kayıt atılamadı!",
              description: selectedItem.belnr + " nolu belge için ters kayıt atılamadı!",
              subtitle: "",
              counter: 1
            });
          },
          function (response) {
            index++;
            that.tersKayitAl(selectedItems, index, errorList);
          });
      } else {
        this.getView().setBusy(false);
        this.extensionAPI.rebindTable();
        this.oViewModel.setProperty("/errorList", errorList);
        this.oErrorDialog.open();
        if (this.oMessageView) {
          this.oMessageView.navigateBack();
        }
      }
    },

    createJournalEntry: function (soapMessage, uuid, ivOperation, successEvent, errorEvent, completeEvent) {
      var settings = {
        "url": "/sap/bc/http/sap/zinf_journal_entry_create?IV_UUID=" + uuid + "&IV_OPERATION=" + ivOperation,
        "method": "POST",
        "timeout": 0,
        "headers": {
          "Content-Type": "application/json"
        },
        "data": soapMessage,
      };
      $.ajax(settings)
        .success(successEvent)
        .error(errorEvent)
        .complete(completeEvent);
    },

    responseTersKayitParse: function (xmlResponse) {
      debugger;
      var serviceReqResult = {
        accountingDocument: "",
        companyCode: "",
        fiscalYear: "",
        logs: []
      }

      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(xmlResponse, "text/xml");
      var rootNode = xmlDoc.getElementsByTagName("JournalEntryCreateConfirmation")[0];
      if (rootNode) {
        var accountingDocumentNode = rootNode.getElementsByTagName("AccountingDocument")[0];
        if (accountingDocumentNode) {
          serviceReqResult.accountingDocument = accountingDocumentNode.textContent;
        }
        var companyCodeNode = rootNode.getElementsByTagName("CompanyCode")[0];
        if (companyCodeNode) {
          serviceReqResult.companyCode = companyCodeNode.textContent;
        }
        var fiscalYearNode = rootNode.getElementsByTagName("FiscalYear")[0];
        if (fiscalYearNode) {
          serviceReqResult.fiscalYear = fiscalYearNode.textContent;
        }
        var itemLogs = rootNode.getElementsByTagName("Item");
        if (itemLogs && itemLogs.length > 0) {
          for (let i = 0; i < itemLogs.length; i++) {
            var typeID = itemLogs[i].getElementsByTagName("TypeID")[0].textContent;
            const severityCode = itemLogs[i].getElementsByTagName("SeverityCode")[0].textContent;
            const note = itemLogs[i].getElementsByTagName("Note")[0].textContent;
            serviceReqResult.logs.push({
              typeID: typeID,
              severityCode: severityCode,
              note: note
            });
          }
        }
      }
      return serviceReqResult;
    },

    getCreateJournalEntrySoapM: function (selectedItem, documentReferenceID) {
      debugger;
      const accountingDocumentType = selectedItem.blart;
      const uuid = selectedItem.uuid;
      const ledgerGroup = selectedItem.rldnr;
      const companyCode = selectedItem.bukrs;
      const glAccount_BS = selectedItem.correct_hkont_bs;
      const glAccount_PL = selectedItem.correct_hkont_pl;
      //const amountInTransactionCurrency = selectedItem.dmbtr;
      const amountInTransactionCurrency = parseFloat(selectedItem.correct_balance);
      // const finalBalance = amountInTransactionCurrency > 0 ? amountInTransactionCurrency : (amountInTransactionCurrency * -1);
      const debitCreditCode_BS = amountInTransactionCurrency > 0 ? 'S' : 'H';
      const debitCreditCode_PL = amountInTransactionCurrency > 0 ? 'H' : 'S';

      let finalBalance1 = amountInTransactionCurrency;
      if (debitCreditCode_BS === "H"){
        if (amountInTransactionCurrency >  0){
          finalBalance1 = amountInTransactionCurrency * -1;
        }
      }else if (debitCreditCode_BS === "S" && amountInTransactionCurrency  < 0){
        finalBalance1 = amountInTransactionCurrency * -1;
      }

      let finalBalance2 = amountInTransactionCurrency;
      if (debitCreditCode_PL === "H"){
        if (amountInTransactionCurrency >  0){
          finalBalance2 = amountInTransactionCurrency * -1;
        }
      }else if (debitCreditCode_PL === "S" && amountInTransactionCurrency  < 0){
        finalBalance2 = amountInTransactionCurrency * -1;
      }

      const senderBusinessSystemID = "0M4T8HG"; // Dev: "0M4T936";
      const filterBar = this.getView().byId("com.ntt.anahesapdegerleme3::sap.suite.ui.generic.template.ListReport.view.ListReport::AnaHesapDegerlemeProg--listReportFilter");
      var documentDate = null;
      if (filterBar && filterBar.getFilterData().budat) {
        documentDate = this.formatDateTime(filterBar.getFilterData().budat.ranges[0].value1, "yyyy-MM-dd");
      }
      const documentHeaderText = selectedItem.hkont + "-" + documentDate;

      // SOAP isteğinin XML formatında oluşturulması
      // posting_fiscal_period xml de yoktur. 
      // var soapMessage = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sfin="http://sap.com/xi/SAPSCORE/SFIN">
      //     <soapenv:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
      //       <wsa:Action>http://sap.com/xi/SAPSCORE/SFIN/JournalEntryBulkLedgerCreationRequest_In/JournalEntryBulkLedgerCreationRequest_InRequest</wsa:Action>
      //       <wsa:MessageID>uuid:`+ uuid + `</wsa:MessageID>
      //     </soapenv:Header>
      //     <soapenv:Body>
      //     <sfin:JournalEntryBulkLedgerCreateRequest>
      //     <MessageHeader>
      //       <ID schemeID="?" schemeAgencyID="?">BKPFF</ID>
      //       <CreationDateTime/>
      //       <TestDataIndicator>false</TestDataIndicator>
      //       <SenderBusinessSystemID>`+ senderBusinessSystemID + `</SenderBusinessSystemID>
      //     </MessageHeader>
      //     <!--1 or more repetitions:-->
      //     <JournalEntryCreateRequest>
      //     <MessageHeader>
      //       <ID>SUB_MSG_1` + documentReferenceID + `</ID>
      //       <CreationDateTime/>
      //     </MessageHeader>
      //     <JournalEntry>
      //     <OriginalReferenceDocumentType>BKPFF</OriginalReferenceDocumentType>
      //     <BusinessTransactionType>RFBU</BusinessTransactionType>
      //     <AccountingDocumentType>`+ accountingDocumentType + `</AccountingDocumentType>
      //     <LedgerGroup>`+ ledgerGroup + `</LedgerGroup>
      //     <DocumentReferenceID>`+ documentReferenceID + `</DocumentReferenceID>
      //     <DocumentHeaderText>ENFLASYON-DÜZELTME</DocumentHeaderText>
      //     <CreatedByUser>`+ this.getUserName() + `</CreatedByUser>
      //     <CompanyCode>`+ companyCode + `</CompanyCode>
      //     <DocumentDate>`+ documentDate + `</DocumentDate>
      //     <PostingDate>`+ documentDate + `</PostingDate>
      //     <Item>
      //     <ReferenceDocumentItem>1</ReferenceDocumentItem>
      //     <GLAccount listID="?">`+ glAccount_BS + `</GLAccount>
      //     <AmountInTransactionCurrency currencyCode="TRY">` + finalBalance1 + `</AmountInTransactionCurrency>                 
      //     <DebitCreditCode>`+ debitCreditCode_BS +`</DebitCreditCode>
      //     <DocumentItemText>ENFLASYON-DÜZELTME</DocumentItemText>
      //     </Item>
      //     <Item>
      //     <ReferenceDocumentItem>1</ReferenceDocumentItem>
      //     <GLAccount listID="?">`+ glAccount_PL + `</GLAccount>
      //     <AmountInTransactionCurrency currencyCode="TRY">` + finalBalance2 + `</AmountInTransactionCurrency> 
      //     <DebitCreditCode>`+ debitCreditCode_PL +`</DebitCreditCode>
      //     <DocumentItemText>ENFLASYON-DÜZELTME</DocumentItemText>
      //     </Item>
      //     </JournalEntry>
      //     </JournalEntryCreateRequest>
      //     </sfin:JournalEntryBulkLedgerCreateRequest>
      //     </soapenv:Body>
      //     </soapenv:Envelope>`;

        var soapMessage =  `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sfin="http://sap.com/xi/SAPSCORE/SFIN">
        <soapenv:Header/>
        <soapenv:Body>
        <sfin:JournalEntryBulkCreateRequest>
        <MessageHeader>
        <CreationDateTime/>
        <ID>MSG_` + documentReferenceID + `</ID>
        </MessageHeader>
        <JournalEntryCreateRequest>
        <MessageHeader>
        <CreationDateTime/>
        <ID>SUBMSG_` + documentReferenceID + `</ID>   
        </MessageHeader>
        <JournalEntry>
        <OriginalReferenceDocumentType>BKPFF</OriginalReferenceDocumentType>
        <BusinessTransactionType>RFBU</BusinessTransactionType>
        <AccountingDocumentType>EF</AccountingDocumentType>
        <DocumentHeaderText>` + documentHeaderText + `</DocumentHeaderText>
        <CreatedByUser>`+ this.getUserName() + `</CreatedByUser>
        <CompanyCode>`+ companyCode + `</CompanyCode>
        <DocumentDate>`+ documentDate + `</DocumentDate>
        <PostingDate>`+ documentDate + `</PostingDate>
        <Item>
          <ReferenceDocumentItem>1</ReferenceDocumentItem>
          <GLAccount listID="?">`+ glAccount_BS + `</GLAccount>
          <AmountInTransactionCurrency currencyCode="TRY">` + finalBalance1 + `</AmountInTransactionCurrency>                 
          <DebitCreditCode>`+ debitCreditCode_BS +`</DebitCreditCode>
          <DocumentItemText>ENF.` + documentDate + `</DocumentItemText>
        </Item>
        <Item>
          <ReferenceDocumentItem>1</ReferenceDocumentItem>
          <GLAccount listID="?">`+ glAccount_PL + `</GLAccount>
          <AmountInTransactionCurrency currencyCode="TRY">` + finalBalance2 + `</AmountInTransactionCurrency> 
          <DebitCreditCode>`+ debitCreditCode_PL +`</DebitCreditCode>
          <DocumentItemText>ENF.` + documentDate + `</DocumentItemText>
        </Item>
        </JournalEntry>
        </JournalEntryCreateRequest>
        </sfin:JournalEntryBulkCreateRequest>
        </soapenv:Body>
        </soapenv:Envelope>`;

      return soapMessage;
    },

    getTersKayitAlSoapM: function (selectedItem) {
      debugger;
      const gjahr = selectedItem.gjahr;
      const companyCode = selectedItem.bukrs;
      const belnr = selectedItem.belnr;
      const accountingDocumentType = selectedItem.blart;
      //var postingDate = this.formatDateTime(selectedItem.budat, "yyyy-MM-dd");
      var postingDateTmp = new Date(selectedItem.budat.getFullYear(), selectedItem.budat.getMonth() + 1, 1, 12, 0, 0);
      var postingDate = this.formatDateTime(postingDateTmp, "yyyy-MM-dd");

      // SOAP isteğinin XML formatında oluşturulması
      var soapMessage = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sfin="http://sap.com/xi/SAPSCORE/SFIN">
        <soapenv:Header/>
        <soapenv:Body>
        <sfin:JournalEntryBulkCreateRequest>
        <MessageHeader>
        <CreationDateTime></CreationDateTime>
        </MessageHeader>
        <JournalEntryCreateRequest>
        <MessageHeader>
        <CreationDateTime></CreationDateTime>
        </MessageHeader>
        <JournalEntry>
        <OriginalReferenceDocumentType>BKPFF</OriginalReferenceDocumentType>
        <BusinessTransactionType>RFBU</BusinessTransactionType>
        <AccountingDocumentType>${accountingDocumentType}</AccountingDocumentType>
        <ReversalReason>01</ReversalReason>
        <ReversalReferenceDocument>${String(belnr).padStart(10, '0')}${companyCode}${gjahr}</ReversalReferenceDocument>
        <CreatedByUser>${this.getUserName()}</CreatedByUser>
        <CompanyCode>${companyCode}</CompanyCode>
        <DocumentDate>${postingDate}</DocumentDate>
        <PostingDate>${postingDate}</PostingDate>
        </JournalEntry>
        </JournalEntryCreateRequest>
        </sfin:JournalEntryBulkCreateRequest>
        </soapenv:Body>
        </soapenv:Envelope>`;

      return soapMessage;
    },

    getSelectedItems: function () {
      const selectedContext = this.extensionAPI.getSelectedContexts();
      const selectedItems = selectedContext.map(oItem => {
        return oItem.getObject();
      });
      return selectedItems;
    },

    getResourceBundle: function () {
      const oResourceBundle = this.getView().getModel("@i18n").getResourceBundle();
      return oResourceBundle;
    },

    formatDateTime: function (fDate, fPattern) {
      var oDateTimeInstance = sap.ui.core.format.DateFormat.getDateTimeInstance({
        pattern: fPattern // "yyyy-MM-dd_mm-ss"
      });
      return oDateTimeInstance.format(fDate);
    },

    getUserName: function () {
      var loginUser = sap.ushell.Container.getUser().getId();
      loginUser = loginUser === "DEFAULT_USER" ? "rahmanyasir.ates@nttdata.com" : loginUser;
      return loginUser;
    },

    getCompanyData: function (selectedItems) {
      this.getView().setBusy(true);
      var oModel = this.getOwnerComponent().getModel();
      var oKey = "/I_CompanyCodeVH";
      var oFilters = [
        new sap.ui.model.Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, selectedItems[0].bukrs)
      ];
      this._onRead(oKey, oModel, oFilters)
        .then((oData) => {
          if (oData.results && oData.results.length > 0) {
            this.oViewModel.setProperty("/CompanyCodeData", oData.results[0]);
            var soapMessage = this.getSoapMessage(selectedItems);
            this.createJournalEntry(soapMessage, selectedItems[0].uuid);
          } else {
            MessageToast.show(this.getResourceBundle().getText("companyDataError"));
          }
        })
        .catch(() => { })
        .finally(() => {
          this.getView().setBusy(false);
        })
    },

    _onRead: function (sSet, oModel, aFilters) {
      return new Promise(function (fnSuccess, fnReject) {
        const mParameters = {
          filters: aFilters,
          success: fnSuccess,
          error: fnReject
        };
        oModel.read(sSet, mParameters);
      });
    },

    _onCreate: function (sSet, oData, oModel) {
      return new Promise(function (fnSuccess, fnReject) {
        const mParameters = {
          success: fnSuccess,
          error: fnReject
        };
        oModel.create(sSet, oData, mParameters);
      });
    },

    _getMessageType: function (type) {
      switch (type) {
        case "1":
          return "Success";
        case "3":
          return "Error";
        case "2":
          return "Warning";
        default:
          return "";
      }
    },

    _createMessageDialog: function () {
      var oMessageTemplate = new MessageItem({
        type: '{type}',
        title: '{title}',
        description: '{description}',
        subtitle: '{subtitle}',
        counter: '{counter}',
        markupDescription: '{markupDescription}'
      });
      this.oMessageView = new MessageView({
        showDetailsPageHeader: false,
        itemSelect: function () {
          oBackButton.setVisible(true);
        },
        items: {
          path: "/errorList",
          template: oMessageTemplate
        }
      });

      var that = this;
      var oBackButton = new sap.m.Button({
        icon: IconPool.getIconURI("nav-back"),
        visible: false,
        press: function () {
          that.oMessageView.navigateBack();
          this.setVisible(false);
        }
      });

      this.oMessageView.setModel(this.oViewModel);
      this.oErrorDialog = new sap.m.Dialog({
        resizable: true,
        content: this.oMessageView,
        state: "None",
        beginButton: new sap.m.Button({
          press: function () {
            this.getParent().close();
          },
          text: "Kapat"
        }),
        customHeader: new sap.m.Bar({
          contentLeft: [oBackButton],
          contentMiddle: [
            new sap.m.Title({
              text: "İşlem sonucu"
            })
          ]
        }),
        contentHeight: "50%",
        contentWidth: "50%",
        verticalScrolling: false
      });
    }
  };
});