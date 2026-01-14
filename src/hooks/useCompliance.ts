// Version: 1.05.00.40
import { useMemo } from "react";
import { InvoiceData } from "../types";
import {
  isFieldInvalid,
  isValidNCM,
  isValidReference,
} from "../utils/validators";
import {
  INCOTERMS_LIST,
  PAYMENT_TERMS_LIST,
  CURRENCIES_LIST,
  COUNTRIES_LIST,
} from "../utils/validationConstants";
import { ncmService } from "../services/ncmService";
import { useTranslation } from "../hooks/useTranslation";

/**
 * Hook to handle Customs Compliance (Art. 557) logic.
 * Generates field error map and a detailed conformity checklist.
 */
export const useCompliance = (data: InvoiceData) => {
  const t = useTranslation();

  // 1. Field Level Errors (for Input highlighting)
  const fieldErrors = useMemo(() => {
    const errs: Record<string, string | null> = {};

    const check = (
      field: string,
      value: any,
      msg: string = t.editor.items.validation.required
    ) => {
      if (isFieldInvalid(value)) errs[field] = msg;
    };

    // Identifiers
    check(
      "invoiceNumber",
      data.invoiceNumber,
      t.editor.compliance.validation.invoiceNumber
    );
    check(
      "packingListNumber",
      data.packingListNumber,
      t.editor.compliance.validation.packingListNumber
    );
    check("date", data.date, t.editor.compliance.validation.date);
    check("dueDate", data.dueDate, t.editor.compliance.validation.dueDate);

    // String based comparison for dates (YYYY-MM-DD) avoids Timezone/UTC instantiation issues
    if (data.date && data.dueDate && !errs.date && !errs.dueDate) {
      if (data.dueDate < data.date) {
        errs.dueDate = t.editor.compliance.validation.dueDateBeforeIssue;
      }
    }

    // Entities
    check(
      "exporterName",
      data.exporterName,
      t.editor.compliance.validation.exporterName
    );
    check(
      "exporterAddress",
      data.exporterAddress,
      t.editor.compliance.validation.exporterAddress
    );
    check(
      "importerName",
      data.importerName,
      t.editor.compliance.validation.importerName
    );
    check(
      "importerAddress",
      data.importerAddress,
      t.editor.compliance.validation.importerAddress
    );

    // Logistics
    check(
      "totalNetWeight",
      data.totalNetWeight,
      t.editor.compliance.validation.netWeight
    );
    check(
      "totalGrossWeight",
      data.totalGrossWeight,
      t.editor.compliance.validation.grossWeight
    );

    if (!errs.totalNetWeight && !errs.totalGrossWeight) {
      if ((data.totalNetWeight || 0) > (data.totalGrossWeight || 0)) {
        errs.totalNetWeight = t.editor.compliance.validation.weightMismatch;
        errs.totalGrossWeight =
          t.editor.compliance.validation.weightMismatchReverse;
      }
    }

    check(
      "totalVolumes",
      data.totalVolumes,
      t.editor.compliance.validation.volumes
    );
    check(
      "volumeType",
      data.volumeType,
      t.editor.compliance.validation.volumeType
    );

    // Trade & Cross-Field Logic
    check(
      "incoterm",
      data.incoterm,
      t.editor.compliance.validation.incotermRequired
    );
    if (data.incoterm) {
      if (!isValidReference(data.incoterm, INCOTERMS_LIST)) {
        if (isValidReference(data.incoterm, CURRENCIES_LIST)) {
          errs.incoterm = t.editor.compliance.validation.incotermIsCurrency;
        } else {
          errs.incoterm = t.editor.compliance.validation.incotermInvalid;
        }
      }
    }

    // Countries
    const checkCountry = (field: string, val: string | null) => {
      check(field, val, t.editor.compliance.validation.countryRequired);
      if (val) {
        if (!isValidReference(val, COUNTRIES_LIST)) {
          if (isValidReference(val, CURRENCIES_LIST)) {
            errs[field] = t.editor.compliance.validation.countryIsCurrency;
          } else {
            errs[field] = t.editor.compliance.validation.countryInvalid;
          }
        }
      }
    };
    checkCountry("countryOfOrigin", data.countryOfOrigin);
    checkCountry("countryOfAcquisition", data.countryOfAcquisition);
    checkCountry("countryOfProvenance", data.countryOfProvenance);

    // Financials
    check(
      "paymentTerms",
      data.paymentTerms,
      t.editor.compliance.validation.paymentRequired
    );
    if (data.paymentTerms) {
      if (!isValidReference(data.paymentTerms, PAYMENT_TERMS_LIST)) {
        errs.paymentTerms = t.editor.compliance.validation.paymentInvalid;
      }
    }

    check(
      "currency",
      data.currency,
      t.editor.compliance.validation.currencyRequired
    );
    if (data.currency) {
      if (!isValidReference(data.currency, CURRENCIES_LIST)) {
        if (isValidReference(data.currency, INCOTERMS_LIST)) {
          errs.currency = t.editor.compliance.validation.currencyIsIncoterm;
        } else {
          errs.currency = t.editor.compliance.validation.currencyInvalid;
        }
      }
    }

    check(
      "subtotal",
      data.subtotal,
      t.editor.compliance.validation.subtotalInvalid
    );
    check(
      "grandTotal",
      data.grandTotal,
      t.editor.compliance.validation.grandTotalInvalid
    );

    return errs;
  }, [
    data,
    t.editor.items.validation.required,
    t.editor.compliance.validation,
  ]);

  // 2. Item Level Swapped Field Detection
  const itemIssues = useMemo(() => {
    const issues: string[] = [];
    const items = data.lineItems || [];

    items.forEach((item, idx) => {
      if (item.partNumber) {
        const cleanPN = item.partNumber.replace(/\D/g, "");
        if (cleanPN.length === 8 && ncmService.getDescription(cleanPN)) {
          issues.push(
            `Item ${idx + 1}: Part Number '${item.partNumber}' ${
              t.editor.compliance.validation.itemPartNumberPossibleNcm
            }`
          );
        }
      }
      if (item.ncm && /[a-zA-Z]/.test(item.ncm)) {
        issues.push(
          `Item ${idx + 1}: ${t.editor.compliance.validation.itemNcmHasLetters}`
        );
      }
    });
    return issues;
  }, [data.lineItems, t.editor.compliance.validation]);

  // 3. High Level Checklist
  const checklist = useMemo(() => {
    const items = data.lineItems || [];

    const createCheck = (
      id: string,
      title: string,
      isValid: boolean,
      emptyValue: any,
      successMsg: string,
      errorMsg: string,
      emptyMsg: string,
      expected: string,
      details: string
    ) => {
      let status = "ok";
      let msg = successMsg;

      if (!isValid) {
        status = "invalid";
        msg = errorMsg;
      }
      if (isFieldInvalid(emptyValue)) {
        status = "missing";
        msg = emptyMsg;
      }

      return { id, title, status, msg, expected, details };
    };

    const allItemsHaveDescription =
      items.length > 0 &&
      items.every(
        (i) =>
          !isFieldInvalid(i.description) && (i.description?.length || 0) <= 254
      );
    const descStatus =
      items.length === 0
        ? "missing"
        : allItemsHaveDescription
        ? "ok"
        : "invalid";
    const descMsg = allItemsHaveDescription
      ? t.editor.compliance.checklist.goods.success
      : items.some((i) => (i.description?.length || 0) > 254)
      ? t.editor.compliance.checklist.goods.errorLength
      : t.editor.compliance.checklist.goods.missing;

    // NCM Check
    const validNcms = items.length > 0 && items.every((i) => isValidNCM(i.ncm));
    let ncmStatus = "ok";
    let ncmMsg = t.editor.compliance.checklist.ncm.success;
    if (items.length === 0) {
      ncmStatus = "missing";
      ncmMsg = t.editor.compliance.checklist.ncm.missing;
    } else if (!validNcms) {
      ncmStatus = "invalid";
      ncmMsg = t.editor.compliance.checklist.ncm.invalid;
    }

    if (itemIssues.length > 0) {
      ncmStatus = "warning";
      ncmMsg = t.editor.compliance.checklist.ncm.warning;
    }

    // STRICT PLI Validation Check (Mirroring PLIValidator.ts)
    // Rules:
    // 1. CODIGO_FABRICANTE: Required + Numeric
    // 2. DETALHE_PRODUTO: Required + Max 4 Chars
    // 3. REFERENCIA_FABRICANTE: Required
    // 4. PESO_LIQUIDO: Numeric
    const itemsInvalidPli = items.filter((i) => {
      const hasInvalidProdDetail =
        !i.taxClassificationDetail || i.taxClassificationDetail.length > 4;
      const hasInvalidMfrCode =
        !i.manufacturerCode || isNaN(Number(i.manufacturerCode));
      const hasInvalidMfrRef =
        !i.manufacturerRef || i.manufacturerRef.trim() === "";
      const hasInvalidNetWeight = !i.netWeight || isNaN(Number(i.netWeight)); // Basic check, already covered but good to double check context

      return (
        hasInvalidProdDetail ||
        hasInvalidMfrCode ||
        hasInvalidMfrRef ||
        hasInvalidNetWeight
      );
    });

    // --- Status Determination for PLI ---
    let pliStatus = "ok";
    let pliMsg = t.editor.compliance.checklist.pli.success;
    let pliDetails = "OK";

    if (items.length === 0) {
      pliStatus = "missing";
      pliMsg = t.editor.compliance.checklist.pli.missing;
      pliDetails = "-";
    } else if (itemsInvalidPli.length > 0) {
      pliStatus = "invalid";
      pliMsg = `${t.editor.compliance.checklist.pli.error.replace(
        "Erros em itens",
        `Erros em ${itemsInvalidPli.length} itens`
      )}`;

      // Hint for the first invalid item
      const i = itemsInvalidPli[0];
      let hint = "";
      if (!i.taxClassificationDetail || i.taxClassificationDetail.length > 4)
        hint = "Detalhe (Tam)";
      else if (!i.manufacturerCode || isNaN(Number(i.manufacturerCode)))
        hint = "Cód. Fabr. (Num)";
      else hint = "Ref. Fabr.";

      // limit hint length
      if (hint.length > 15) hint = hint.substring(0, 15);

      pliDetails = `${t.editor.compliance.checklist.pli.hint} ${
        items.indexOf(i) + 1
      }: ${hint}...`;
    }

    const missingName = t.app.status.docNoNumber || "Nome Ausente";

    return [
      createCheck(
        "exporter",
        t.editor.compliance.checklist.exporter.title,
        !fieldErrors.exporterName && !fieldErrors.exporterAddress,
        data.exporterName,
        t.editor.compliance.checklist.exporter.success,
        t.editor.compliance.checklist.exporter.error,
        t.editor.compliance.checklist.exporter.missing,
        t.editor.compliance.checklist.exporter.expected,
        !data.exporterName ? missingName : "OK"
      ),

      createCheck(
        "importer",
        t.editor.compliance.checklist.importer.title,
        !fieldErrors.importerName && !fieldErrors.importerAddress,
        data.importerName,
        t.editor.compliance.checklist.importer.success,
        t.editor.compliance.checklist.importer.error,
        t.editor.compliance.checklist.importer.missing,
        t.editor.compliance.checklist.importer.expected,
        !data.importerName ? missingName : "OK"
      ),

      {
        id: "spec",
        title: t.editor.compliance.checklist.goods.title,
        status: descStatus,
        msg: descMsg,
        expected: t.editor.compliance.checklist.goods.expected,
        details: `${items.length} itens.`,
      },

      {
        id: "ncm",
        title: t.editor.compliance.checklist.ncm.title,
        status: ncmStatus,
        msg: ncmMsg,
        expected: t.editor.compliance.checklist.ncm.expected,
        details:
          itemIssues.length > 0
            ? itemIssues[0]
            : t.editor.items.validation.required,
      },

      {
        id: "pli_details",
        title: t.editor.compliance.checklist.pli.title,
        status: pliStatus,
        msg: pliMsg,
        expected: t.editor.compliance.checklist.pli.expected,
        details: pliDetails,
      },

      createCheck(
        "volumes",
        t.editor.compliance.checklist.volumes.title,
        !fieldErrors.totalVolumes && !fieldErrors.volumeType,
        data.totalVolumes,
        t.editor.compliance.checklist.volumes.success,
        t.editor.compliance.checklist.volumes.error,
        t.editor.compliance.checklist.volumes.missing,
        t.editor.compliance.checklist.volumes.expected,
        `Qtd: ${data.totalVolumes || "-"}`
      ),

      createCheck(
        "gross_weight",
        t.editor.compliance.checklist.grossWeight.title,
        !fieldErrors.totalGrossWeight,
        data.totalGrossWeight,
        t.editor.compliance.checklist.grossWeight.success,
        fieldErrors.totalGrossWeight || "Erro.",
        t.editor.compliance.checklist.grossWeight.missing,
        t.editor.compliance.checklist.grossWeight.expected,
        `PB: ${data.totalGrossWeight}`
      ),

      createCheck(
        "net_weight",
        t.editor.compliance.checklist.netWeight.title,
        !fieldErrors.totalNetWeight,
        data.totalNetWeight,
        t.editor.compliance.checklist.netWeight.success,
        fieldErrors.totalNetWeight || "Erro.",
        t.editor.compliance.checklist.netWeight.missing,
        t.editor.compliance.checklist.netWeight.expected,
        `PL: ${data.totalNetWeight}`
      ),

      createCheck(
        "origin",
        t.editor.compliance.checklist.origin.title,
        !fieldErrors.countryOfOrigin,
        data.countryOfOrigin,
        t.editor.compliance.checklist.origin.success,
        fieldErrors.countryOfOrigin ||
          t.editor.compliance.checklist.origin.invalid,
        t.editor.compliance.checklist.origin.missing,
        t.editor.compliance.checklist.origin.expected,
        `${data.countryOfOrigin || "-"}`
      ),

      createCheck(
        "payment",
        t.editor.compliance.checklist.payment.title,
        !fieldErrors.paymentTerms,
        data.paymentTerms,
        t.editor.compliance.checklist.payment.success,
        fieldErrors.paymentTerms ||
          t.editor.compliance.checklist.payment.invalid,
        t.editor.compliance.checklist.payment.missing,
        t.editor.compliance.checklist.payment.expected,
        `${data.paymentTerms || "-"}`
      ),

      createCheck(
        "currency",
        t.editor.compliance.checklist.currency.title,
        !fieldErrors.currency,
        data.currency,
        t.editor.compliance.checklist.currency.success,
        fieldErrors.currency || t.editor.compliance.checklist.currency.invalid,
        t.editor.compliance.checklist.currency.missing,
        t.editor.compliance.checklist.currency.expected,
        `${data.currency || "-"}`
      ),

      createCheck(
        "incoterm",
        t.editor.compliance.checklist.incoterm.title,
        !fieldErrors.incoterm,
        data.incoterm,
        t.editor.compliance.checklist.incoterm.success,
        fieldErrors.incoterm || t.editor.compliance.checklist.incoterm.invalid,
        t.editor.compliance.checklist.incoterm.missing,
        t.editor.compliance.checklist.incoterm.expected,
        `${data.incoterm || "-"}`
      ),
    ];
  }, [data, fieldErrors, itemIssues, t]);

  const compliancePercentage = useMemo(() => {
    if (checklist.length === 0) return 0;

    const pliItem = checklist.find((i) => i.id === "pli_details");
    const otherItems = checklist.filter((i) => i.id !== "pli_details");

    const pliScore = pliItem?.status === "ok" ? 1 : 0;

    const otherOkCount = otherItems.filter((i) => i.status === "ok").length;
    const otherScore =
      otherItems.length > 0 ? otherOkCount / otherItems.length : 0;

    // Constraint Weighting Strategy:
    // -------------------------------------------------------------------------
    // 1. General Compliance (80%): Covers critical Art. 557 fields (Importer, Exporter, NCM, etc).
    //    These are the legal "must-haves" for any customs clearance.
    // 2. PLI Specifics (20%): Covers the "Product List Information" (PLI) model details
    //    (Manufacturer Code, Product Details). While important for the industry model,
    //    missing them is less critical than missing the Importer/Exporter.
    // -------------------------------------------------------------------------
    const weighted = otherScore * 0.8 + pliScore * 0.2;

    return Math.round(weighted * 100);
  }, [checklist]);

  return { fieldErrors, checklist, compliancePercentage };
};
