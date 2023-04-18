const AfipWebService = require('./AfipWebService');

/**
 * SDK para generar Facturas E (AFIP Export Electronic Billing) (wsfexv1)
 * 
 * @link https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf WS Specification
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
   * Obtiene El ultimo numero de comprobante
   *
   * Retorna el último número de comprobante autorizado para el punto de venta y tipo de
   * comprobante enviado.  {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification
   * item 2.4}
   *
   * @param {int} punto_de_venta punto de venta del ultimo comprobante
   * @param {int} tipo Tipo de comprobante del ultimo voucher
   *
   * @return {int} Ultimo numero de comprobante autorizado
   * 
   * @example Ejemplo de respuesta
   * 26
   **/
	 async getLastVoucher(salesPoint, type) {
		const req = {
			Pto_venta: salesPoint,
			Cbte_Tipo: type,
		}

		return (await this.executeRequest("FEXGetLast_CMP", req)).FEXResult_LastCMP.Cbte_nro;
	  }
	
	/**
	 * Crea un Comprobante en afip
	 *
	 * Envía a los servidores de AFIP una solicitud para crear un comprobante
	 * y asignar un CAE  {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification item 2.1}
	 *
	 * @param {object} data datos del comprobante (Ver specification para los datos a enviar del comprobante) {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification
	 * 	item 2.1.3}
	 * @param {bool}  returnResponse si es seteado a TRUE retorna la respuesta completa
	 * 	de AFIP
	 *
	 * @return {array} Retorna la información del comprobante de ingreso agregándole el CAE otorgado. Ante cualquier
     *	anomalía se retorna un código de error cancelando la ejecución del WS. 
	 *  Si returnResponse se establece en false devuelve: 
	 * 	[CAE : CAE assigned to voucher, CAEFchVto : Fecha de Expiracion
	 * 	para el CAE (yyyy-mm-dd)] si no retorna la informacion completa del comprobante en
	 * 	AFIP {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification item 2.1.4}
	 * 
	 * 
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
	   * Crea un proximo comprobante en afip
	   *
	   * Este metodo combina Afip.getLastVoucher y  Afip.createVoucher
	   * para crear el siguiente voucher
	   *
	   * @param {object} data misma data que se usa en Afip.createVoucher excepto que no 
	   * 	necesita los atributos CbteDesde y CbteHasta 
	   *
	   * @return {array} [CAE : CAE asignado al voucher, CAEFchVto : Fecha
	   * 	de expiración del CAE (yyyy-mm-dd), voucherNumber : Numero asignado al
	   * 	comprobante]
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
	   * Obtiene la informacion completa de un comprobante
	   *
	   * Retorna los detalles de un comprobante ya enviado y autorizado {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.2 }
	   *
	   * @param {int} number 		Numero de comprobante del cual se quiere información
	   * @param {int} salesPoint 	Punto de venta del comprobante del cual se quiere información
	   * @param {int} type 		Tipo de comprobante del cual se quiere información
	   *
	   * @return {Object|null} array con la informacion completa del comprobante
	   * 	{@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification item 2.2.3 } or null si no existe
	   * 
	   * @example Ejemplo de Respuesta
	   * 
	   * {Id: '43',Fecha_cbte: '20230315',Cbte_tipo: '19',Punto_vta: 5,Cbte_nro: '25',Tipo_expo: '4',Permiso_existente: '',Dst_cmp: '250',Cliente: 'Mengano Test',Cuit_pais_cliente: '55000009996',Domicilio_cliente: 'av siempretest 123',Id_impositivo: '',Moneda_Id: 'PES',Moneda_ctz: '1',Obs_comerciales: '',Imp_total: '500000',Obs: 'test obs',Forma_pago: '',Incoterms: '',Incoterms_Ds: '0',Idioma_cbte: '1',Items: { Item: [ [Object] ] },Fch_venc_Cae: '20230315',Cae: '73120007972790',Resultado: 'A',Motivos_Obs: '',Fecha_pago: '20230315'}
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
	   * Retorna el último id de requerimiento para la cuit enviada {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.3}
	   *
	   * @return {long} id  {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification item 2.3.3}
	   * 
	   * @example Ejemplo de respuesta
	   * 44
	   **/
	  async getLastId() {
		return (await this.executeRequest("FEXGetLast_ID")).FEXResultGet.Id;
	  }
	
	  /**
	   * Obtener monedas válidas {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.5}
	   *
	   * @return {array}  Listado de monedas válidas
	   * 
	   * @example Ejemplo de respuesta
	   * [{Mon_Id: 'PES',Mon_Ds: 'Pesos Argentinos',Mon_vig_desde: '20090403',Mon_vig_hasta: 'NULL'}]
	   **/
	  async getCurrencies() {
		return (await this.executeRequest("FEXGetPARAM_MON")).FEXResultGet
		  .ClsFEXResponse_Mon;
	  }
	
	  /**
	   * Recuperador de valores referenciales de códigos de Tipo de exportación  {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.7}
	   *
	   * @return {array}  Listado de tipos de exportación válidos.
	   * {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification item 2.7.3}
	   * 
	   * @example Ejemplo de respuesta
	   * [{Tex_Id: '1',Tex_Ds: 'Exportación definitiva de Bienes',Tex_vig_desde: '20100101', Tex_vig_hasta: 'NULL'}]
	   **/
	  async getExportTypes() {
		return (await this.executeRequest("FEXGetPARAM_Tipo_Expo")).FEXResultGet
		  .ClsFEXResponse_Tex;
	  }
	
	  /**
	   * Obtener valores referenciales de códigos de Unidades de Medida {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.8}
	   *
	   * @return {array}  Listado de unidades de medida válidos. {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification item 2.8.3}
	   * 
	   * @example Ejemplo de respuesta
	   * [{Umed_Id: '41',Umed_Ds: 'miligramos',Umed_vig_desde: '20080704',Umed_vig_hasta: 'NULL'}]
	   **/
	  async getUnits() {
		return (await this.executeRequest("FEXGetPARAM_UMed")).FEXResultGet
		  .ClsFEXResponse_UMed;
	  }
	
	  /**
	   * Obtener valores referenciales de códigos de Idiomas {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.9}
	   *
	   * @return {array}  Listado codigos de Idiomas válidos. {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification item 2.9.3}
	   * 
	   * @example Ejemplo de respuesta
	   * [{ Idi_Id: '1', Idi_Ds: 'Español', Idi_vig_desde: '20091228', Idi_vig_hasta: 'NULL'}]
	   **/
	  async getLanguage() {
		return (await this.executeRequest("FEXGetPARAM_Idiomas")).FEXResultGet
		  .ClsFEXResponse_Idi;
	  }
	
	  /**
	   * Obtiene  valores referenciales de códigos de Países {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.10}
	   *
	   * @return {array}  Listado de codigos de países válidos.
	   * 
	   * @example Ejemplo de respuesta
	   * [{ DST_Codigo: '101', DST_Ds: 'BURKINA FASO' }]
	   **/
	  async getCountries() {
		return (await this.executeRequest("FEXGetPARAM_DST_pais")).FEXResultGet
		  .ClsFEXResponse_DST_pais;
	  }
	
	  /**
	   * Obtener valores referenciales de Incoterms {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.11}
	   *
	   * @return {array}  Listado de Incoterms
	   * 
	   * @Example Ejemplo de respuesta
	   * [{Inc_Id: 'EXW', Inc_Ds: 'EXW',Inc_vig_desde: '20100101',Inc_vig_hasta: 'NULL'}]
	   **/
	  async getIncoterms() {
		return (await this.executeRequest("FEXGetPARAM_Incoterms")).FEXResultGet
		  .ClsFEXResponse_Inc;
	  }
	
	  /**
	   * Obtener CUITs de Países disponibles {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.12}
	   *
	   * @return {array} Listado de CUITs de países válidos
	   * 
	   * @example Ejemplo de respuesta
	   * [{ DST_CUIT: '50000000016', DST_Ds: 'URUGUAY - Persona Fí­sica' }]
	   **/
	  async getCUITsOfCountries() {
		return (await this.executeRequest("FEXGetPARAM_DST_CUIT")).FEXResultGet
		  .ClsFEXResponse_DST_cuit;
	  }
	
	  /**
	   * Obtener cotización de moneda 
	   * Retorna la última cotización de la base de datos aduanera de la moneda ingresada. Este valor es orientativo {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.13 }
	   *
	   * @param {string} moneyId id de la moneda de la cual se quiere obtener informacion
	   *
	   * @return {Object} con Mon_ctz (cotizacion aproximada) y  Mon_fecha ( para el dia de la fecha)
	   * {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification item 2.13 } or null if there not exists
	   * 
	   * @example Ejemplo de Respuesta
	   * { Mon_ctz: '208.0810', Mon_fecha: '20230322' }
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
	   * Obtener puntos de venta asignados a Facturación electrónica de 
	   * comprobantes de Exportación vía Web Services {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.14}
	   * 
	   * Retorna el listado de los puntos de venta registrados para la operación de comprobantes
	   * electrónicos para exportación vía web services.
	   *
	   * @return {array} Listado de todos los puntos de venta
	   **/
	  async getSalesPointsValids() {
		return (await this.executeRequest("FEXGetPARAM_PtoVenta")).FEXResultGet;
	  }
	
	  /**
	   * Obtener el listado de los datos opcionales que se pueden enviar en el presente web services {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.15}
	   *
	   * @return {array} Listado de los tipos opcionales
	   * 
	   * @example Ejemplo de respuesta
	   * [{Opc_Id: '2401',Opc_Ds: 'RÉGIMEN DE EXPORTACIÓN SIMPLIFICADA - Documento de Exportación Simple',Opc_vig_desde: '20210930',Opc_vig_hasta: 'NULL'}]
	   **/
	  async getOptionsTypes() {
		return (await this.executeRequest("FEXGetPARAM_Opcionales")).FEXResultGet
		  .ClsFEXResponse_Opc;
	  }


	  /**
	   * Obtener tipos de comprobante válidos {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.6}
	   *
	   * @return {array} Listado de tipos de comprobantes
	   * 	   
	   * @example Ejemplo de respuesta
	   * [{Cbte_Id: '19',Cbte_Ds: 'Facturas de Exportación',Cbte_vig_desde: '20100101',Cbte_vig_hasta: 'NULL'}]
	   **/
	  async getsVoucherTypes() {
	 	return (await this.executeRequest("FEXGetPARAM_Cbte_Tipo")).FEXResultGet
		.ClsFEXResponse_Cbte_Tipo;
	  }


	  /**
	   * Obtener el  Listado de todas las monedas que tienen un precio ADUANAL en una fecha determinada {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.19}
	   *
	   * @param {string} date fecha para obtener información, formato esperado: YYYYMMDD
	   * 
	   * @return {array} Listado de todas las monedas que tienen un precio ADUANAL
	   * 
	   * @example Ejemplo de respuesta
	   * [{ Mon_Id: '002', Mon_ctz: '2.08', Fecha_ctz: '3/21/2023' }]
	   **/
	   async getMonConCot(date) {
		let req = { Fecha_CTZ : date}
		return (await this.executeRequest("FEXGetPARAM_MON_CON_COTIZACION",req)).FEXResultGet
	   .ClsFEXResponse_Mon_CON_Cotizacion;
	 }	
	 
	  /**
	   * Obtener actividades del emisor a la fecha consultada  {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.20}
	   *
	   * @return {array} Listado de todas las actividades del emisor a la fecha consultada habilitadas
	   * 
	   * @example Ejemplo de respuesta
	   * 
	   * [{ Id: '11111', Orden: '32', Desc: 'CULTIVO DE ARROZ' }]
	   **/
	   async getActivities() {
		return (await this.executeRequest("FEXGetPARAM_Actividades")).FEXResultGet
	   .ClsFEXResponse_ActividadTipo;
	 }	  	 

	
	  /**
	   *
	   * Verificar a servidores de AFIP existencia de Permiso/País de destino en bases de datos aduaneras {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.16 }
	   *
	   * @param {string} permissionId  codigo de Shipping.
	   * @param {int} countryid  id del pais para obtener la informacion
	   *
	   * @return {Object} Devuelve como estado OK si la información sobre la relación permiso de embarque/país de destino está registrada 
	   * en la base de datos de aduanas, de lo contrario "NO" o null si no existe
	   * {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf Specification item 2.16 }.
	   * 
	   * @example Ejemplo de respuesta
	   * { Status: 'OK' }
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
	   * @ignore
	   * Pregunta al servicio web por el estado de los servidores (Servici de prueba "FEXDummy") {@see https://www.afip.gob.ar/fe/documentos/WSFEX-Manual-para-el-desarrollador.pdf
	   * Specification item 2.17}
	   *
	   * @return {Object} { AppServer : Web Service status,
	   * DbServer : Database status, AuthServer : Autentication
	   * server status}
	   **/
	  async getServerStatus() {
		return await this.executeRequest("FEXDummy");
	  }
	
	  /**
	   * @ignore
	   * Cambia el formato de fecha enviado a AFIP de (yyyymmdd) a yyyy-mm-dd
	   *
	   * @param {string|int} date  fecha a formatear
	   *
	   * @return {string} date in format yyyy-mm-dd
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
	   * @ignore
	   * Envia los requests a los servidores de AFIP
	   *
	   * @param {string} 	operation Operacion SOAP a realizar
	   * @param {array} 	params 	Parametros a enviar
	   *
	   * @return mixed Resultado de la operacion
	   **/
	  async executeRequest(operation, params = {}) {
		Object.assign(params, await this.getWSInitialRequest(operation, params));
		const results = await super.executeRequest(operation, params);
	
		await this._checkErrors(operation, results);
	
		return results[operation + "Result"];
	  }
	
	  /**
	   * @ignore
	   * Crea parámetros de solicitud predeterminados para la mayoría de las operaciones.
	   *
	   * @param {string} operation operacion SOAP a realizar
	   *
	   * @return {array} de parametros de solicitud
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
	
	  async _checkErrors(operation, results) {
		const res = results[operation + "Result"];

		if (res.FEXErr && res.FEXErr.ErrCode != 0) {
			console.log(res.FEXErr)
			const err = Array.isArray(res.FEXErr) ? res.FEXErr[0] : res.FEXErr;
			if (+err.ErrCode !== 0) throw new Error(`(${err.ErrCode}) ${err.ErrMsg}`);
		}
	}
}