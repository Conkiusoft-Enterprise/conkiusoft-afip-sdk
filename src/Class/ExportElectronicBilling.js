const AfipWebService = require('./AfipWebService');

/**
 * SDK for AFIP Export Electronic Billing (wsfexv1)
 * 
 * @link http://www.afip.gob.ar/fe/documentos/manual_desarrollador_COMPG_v2_10.pdf WS Specification
 **/
module.exports = class ElectronicBilling extends AfipWebService {
	constructor(afip){
		const options = {
            soapV12: true,
            WSDL: "wsfex-production.wsdl",
            URL: "https://servicios1.afip.gov.ar/wsfexv1/service.asmx",
            WSDL_TEST: "wsfex.wsdl",
            URL_TEST: "https://wswhomo.afip.gov.ar/wsfexv1/service.asmx",
            afip,
		}

		super(options, { service: 'wsfex' });
	}

	/**
   * Gets last voucher number
   *
   * Asks to Afip servers for number of the last voucher created for
   * certain sales point and voucher type {@see WS Specification
   * item 2.4}
   *
   * @param int salesPoint 	Sales point to ask for last voucher
   * @param int type 		Voucher type to ask for last voucher
   *
   * @return int
   **/
	 async getLastVoucher(salesPoint, type) {
		const req = {
			Pto_venta: salesPoint,
			Cbte_Tipo: type,
		}

		return (await this.executeRequest("FEXGetLast_CMP", req)).FEXResult_LastCMP.Cbte_nro;
	  }
	
	  /**
	   * Create a voucher from AFIP
	   *
	   * Send to AFIP servers request for create a voucher and assign
	   * CAE to them {@see WS Specification item 4.1}
	   *
	   * @param array data Voucher parameters {@see WS Specification
	   * 	item 4.1.3}, some arrays were simplified for easy use {@example
	   * 	examples/createVoucher.js Example with all allowed
	   * 	 attributes}
	   * @param bool returnResponse if is TRUE returns complete response
	   * 	from AFIP
	   *
	   * @return array if returnResponse is set to false returns
	   * 	[CAE : CAE assigned to voucher, CAEFchVto : Expiration date
	   * 	for CAE (yyyy-mm-dd)] else returns complete response from
	   * 	AFIP {@see WS Specification item 4.1.3}
	   **/
	  async createVoucher(data, returnResponse = false) {
		const Id = +(await this.getLastId()) + 1;
		const req = {
		  Cmp: data
		};
		
		req.Cmp.Id = Id
		
	
		if (req.Cmp["Permisos"]) req.Cmp["Permisos"] = { Permiso: data["Permisos"] };
	
		if (req.Cmp["Cmps_asoc"]) req.Cmp["Cmps_asoc"] = { Cmp_asoc: data["Cmps_asoc"] };
	
		if (req.Cmp["Items"]) req.Cmp["Items"] = { Item: data["Items"] };
	
		if (req.Cmp["Opcionales"]) req.Cmp["Opcionales"] = { Opcional: data["Opcionales"] };

	
		const results = await this.executeRequest("FEXAuthorize", req);
	
		if (returnResponse === true) {
		  return results;
		} else {
		  if (Array.isArray(results.FEXResultAuth)) {
			results.FEXResultAuth =
			  results.FEXResultAuth[0];
		  }
	
		  return {
			CAE: results.FEXResultAuth.Cae,
			CAEFchVto: this.formatDate(
			  results.FEXResultAuth.Fch_venc_Cae
			),
		  };
		}
	  }
	
	  /**
	   * Create next voucher from AFIP
	   *
	   * This method combines Afip.getLastVoucher and Afip.createVoucher
	   * for create the next voucher
	   *
	   * @param array data Same to data in Afip.createVoucher except that
	   * 	don't need CbteDesde and CbteHasta attributes
	   *
	   * @return array [CAE : CAE assigned to voucher, CAEFchVto : Expiration
	   * 	date for CAE (yyyy-mm-dd), voucherNumber : Number assigned to
	   * 	voucher]
	   **/
	  async createNextVoucher(data) {
		const lastVoucher = await this.getLastVoucher(data["Punto_vta"], data["Cbte_Tipo"]); 

		const voucherNumber = lastVoucher + 1;
	
		data["CbteDesde"] = voucherNumber;
		data["CbteHasta"] = voucherNumber;
	
		let res = await this.createVoucher(data);
		res["voucherNumber"] = voucherNumber;
	
		return res;
	  }
	
	  /**
	   * Get complete voucher information
	   *
	   * Asks to AFIP servers for complete information of voucher {@see WS
	   * Specification item 2.2 }
	   *
	   * @param int number 		Number of voucher to get information
	   * @param int salesPoint 	Sales point of voucher to get information
	   * @param int type 			Type of voucher to get information
	   *
	   * @return array|null returns array with complete voucher information
	   * 	{@see WS Specification item 2.2 } or null if there not exists
	   **/
	  async getVoucherInfo(number, salesPoint, type) {
		const req = {
		  Cmp: {
			Cbte_tipo: type,
			Punto_vta: salesPoint,
			Cbte_nro: number
		  }
		};

		return (await this.executeRequest("FEXGetCMP", req)).FEXResultGet;

	  }
	
	  /**
	   * Asks to AFIP Servers for requirement id availables {@see WS
	   * Specification item 2.3}
	   *
	   * @return long id
	   **/
	  async getLastId() {
		return (await this.executeRequest("FEXGetLast_ID")).FEXResultGet.Id;
	  }
	
	  /**
	   * Asks to AFIP Servers for all currencies availables {@see WS
	   * Specification item 2.5}
	   *
	   * @return array all currencies
	   **/
	  async getCurrencies() {
		return (await this.executeRequest("FEXGetPARAM_MON")).FEXResultGet
		  .ClsFEXResponse_Mon;
	  }
	
	  /**
	   * Asks to AFIP Servers for all exports types availables {@see WS
	   * Specification item 2.7}
	   *
	   * @return array all exports type
	   **/
	  async getExportTypes() {
		return (await this.executeRequest("FEXGetPARAM_Tipo_Expo")).FEXResultGet
		  .ClsFEXResponse_Tex;
	  }
	
	  /**
	   * Asks to AFIP Servers for all unit measures availables {@see WS
	   * Specification item 2.8}
	   *
	   * @return array all units measures type
	   **/
	  async getUnits() {
		return (await this.executeRequest("FEXGetPARAM_UMed")).FEXResultGet
		  .ClsFEXResponse_UMed;
	  }
	
	  /**
	   * Asks to AFIP Servers for languagues availables {@see WS
	   * Specification item 2.9}
	   *
	   * @return array all language
	   **/
	  async getLanguage() {
		return (await this.executeRequest("FEXGetPARAM_Idiomas")).FEXResultGet
		  .ClsFEXResponse_Idi;
	  }
	
	  /**
	   * Asks to AFIP Servers for countries availables {@see WS
	   * Specification item 2.10}
	   *
	   * @return array all countries
	   **/
	  async getCountries() {
		return (await this.executeRequest("FEXGetPARAM_DST_pais")).FEXResultGet
		  .ClsFEXResponse_DST_pais;
	  }
	
	  /**
	   * Asks to AFIP Servers for incoterms {@see WS
	   * Specification item 2.11}
	   *
	   * @return array all Incoterms
	   **/
	  async getIncoterms() {
		return (await this.executeRequest("FEXGetPARAM_Incoterms")).FEXResultGet
		  .ClsFEXResponse_Inc;
	  }
	
	  /**
	   * Asks to AFIP Servers for CUIT countries availables {@see WS
	   * Specification item 2.12}
	   *
	   * @return array all CUIT countries
	   **/
	  async getCUITsOfCountries() {
		return (await this.executeRequest("FEXGetPARAM_DST_CUIT")).FEXResultGet
		  .ClsFEXResponse_DST_cuit;
	  }
	
	  /**
	   * Get complete voucher information
	   *
	   * Asks to AFIP servers for complete information of voucher {@see WS
	   * Specification item 2.13 }
	   *
	   * @param moneyId string 	moneyId to get information
	   *
	   * @return array|null returns array with complete voucher information
	   * 	{@see WS Specification item 2.13 } or null if there not exists
	   **/
	  async getQuoteCurrency(moneyId) {
		const req = {
		  Mon_id: moneyId,
		};
	
		const result = await this.executeRequest("FEXGetPARAM_Ctz", req).catch(
		  (err) => {
			throw err;
		  }
		);
	
		return result.FEXResultGet;
	  }
	
	  /**
	   * Asks to AFIP Servers for CUIT countries availables {@see WS
	   * Specification item 2.14}
	   *
	   * @return array all sales points countries
	   **/
	  async getSalesPointsValids() {
		return (await this.executeRequest("FEXGetPARAM_PtoVenta")).FEXResultGet;
	  }
	
	  /**
	   * Asks to AFIP Servers for CUIT options availables {@see WS
	   * Specification item 2.15}
	   *
	   * @return array all options types
	   **/
	  async getOptionsTypes() {
		return (await this.executeRequest("FEXGetPARAM_Opcionales")).FEXResultGet
		  .ClsFEXResponse_Opc;
	  }


	  /**
	   * Asks to AFIP Servers for the list of voucher types and their code that can be used in the authorization service {@see WS
	   * Specification item 2.14}
	   *
	   * @return array all voucher types
	   **/
	  async getsVoucherTypes() {
	 	return (await this.executeRequest("FEXGetPARAM_Cbte_Tipo")).FEXResultGet
		.ClsFEXResponse_Cbte_Tipo;
	  }


	  /**
	   * Asks to AFIP Servers for the list of coins that have a CUSTOMS price on a certain date {@see WS
	   * Specification item 2.14}
	   *
	   * @param date string date to get information format: YYYYMMDD
	   * 
	   * @return array all coins that have a CUSTOMS price
	   **/
	   async getMonConCot(date) {
		let req = { Fecha_CTZ : date}
		return (await this.executeRequest("FEXGetPARAM_MON_CON_COTIZACION",req)).FEXResultGet
	   .ClsFEXResponse_Mon_CON_Cotizacion;
	 }	
	 
	  /**
	   * Asks to AFIP Servers for the list of the different activities enabled for the issuer {@see WS
	   * Specification item 2.14}
	   *
	   * @return array all different activities enabled for the issuer
	   **/
	   async getActivities() {
		return (await this.executeRequest("FEXGetPARAM_Actividades")).FEXResultGet
	   .ClsFEXResponse_ActividadTipo;
	 }	  	 

	
	  /**
	   *
	   * Verify to AFIP servers existence of Permit/Country of destination in customs databases {@see WS
	   * Specification item 2.16 }
	   *
	   * @param permissionId string Shipping permit code.
	   * @param countryid int countryid to get information
	   *
	   * @return Returns as status OK if the information on the shipping permit/country of destination relationship
	   *	is registered in the customs database, otherwise "NO".
	   * 	{@see WS Specification item 2.16 } or null if there not exists
	   **/
	  async verifyPermissionExistenceCountryById(permissionId, countryId) {
		const req = {
		  ID_Permiso: permissionId,
		  Dst_merc: countryId,
		};
	
		const result = await this.executeRequest("FEXCheck_Permiso", req).catch(
		  (err) => {
			throw err;
		  }
		);

		return result.FEXResultGet;
	  }
	
	  /**
	   * Asks to web service for servers status {@see WS
	   * Specification item 2.17}
	   *
	   * @return object { AppServer : Web Service status,
	   * DbServer : Database status, AuthServer : Autentication
	   * server status}
	   **/
	  async getServerStatus() {
		return await this.executeRequest("FEXDummy");
	  }
	
	  /**
	   * Change date from AFIP used format (yyyymmdd) to yyyy-mm-dd
	   *
	   * @param string|int date to format
	   *
	   * @return string date in format yyyy-mm-dd
	   **/
	  formatDate(date) {
		return date
		  .toString()
		  .replace(
			/(\d{4})(\d{2})(\d{2})/,
			(string, year, month, day) => `${year}-${month}-${day}`
		  );
	  }
	
	  /**
	   * Sends request to AFIP servers
	   *
	   * @param string 	operation 	SOAP operation to do
	   * @param array 	params 	Parameters to send
	   *
	   * @return mixed Operation results
	   **/
	  async executeRequest(operation, params = {}) {
		Object.assign(params, await this.getWSInitialRequest(operation, params));
		const results = await super.executeRequest(operation, params);
	
		await this._checkErrors(operation, results);
	
		return results[operation + "Result"];
	  }
	
	  /**
	   * Make default request parameters for most of the operations
	   *
	   * @param string operation SOAP Operation to do
	   *
	   * @return array Request parameters
	   **/
	  async getWSInitialRequest(operation, params) {
		if (operation === "FEDummy") {
		  return {};
		}

		const { token, sign } = await this.afip.GetServiceTA("wsfex");

		const authObj = {
			Auth: {
			  Token: token,
			  Sign: sign,
			  Cuit: this.afip.CUIT
			}
		};

		/*	
		FEXGetLast_CMP es la unica operacion que necesita poner los datos del Pto_venta y Cbte_Tipo DENTRO DEL OBJETO AUTH,
		el resto de las operaciones ponen la data por FUERA del objeto AUTH.
		*/

		if(operation === 'FEXGetLast_CMP'){
			authObj.Auth.Pto_venta = params.Pto_venta;
			authObj.Auth.Cbte_Tipo = params.Cbte_Tipo;
		}

		return authObj;
	  }
	
	  /**
	   * Check if occurs an error on Web Service request
	   *
	   * @param string 	operation 	SOAP operation to check
	   * @param mixed 	results 	AFIP response
	   *
	   * @throws Exception if exists an error in response
	   *
	   * @return void
	   **/
	  async _checkErrors(operation, results) {
		const res = results[operation + "Result"];

		if (res.FEXErr && res.FEXErr.ErrCode != 0) {
			console.log(res.FEXErr)
			const err = Array.isArray(res.FEXErr) ? res.FEXErr[0] : res.FEXErr;
			if (+err.ErrCode !== 0) throw new Error(`(${err.ErrCode}) ${err.ErrMsg}`);
		}
	}
}