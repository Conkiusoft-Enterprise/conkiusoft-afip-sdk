const AfipWebService = require('./AfipWebService');

/**
 * SDK para generar Facturas A  Y B (AFIP Electronic Billing) (wsfe1)
 * 
 * @link https://www.afip.gob.ar/fe/ayuda/documentos/wsfev1-COMPG.pdf WS Specification
 **/
module.exports = class ElectronicBilling extends AfipWebService {
	constructor(afip){
		const options = {
			soapV12: true,
			WSDL: 'wsfe-production.wsdl',
			URL: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
			WSDL_TEST: 'wsfe.wsdl',
			URL_TEST: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
			afip
		}

		super(options, { service: 'wsfe' });
	}

	/**
	 * Obtener ultimo comprobante  
	 * 
	 * Retorna el ultimo comprobante autorizado para el tipo de comprobante y punto de venta  {@see WS Specification 
	 * item 2.16} 
	 *
	 * @param {int} salesPoint 	Punto de venta del ultimo comprobante 
	 * @param {int} type 		Tipo de comprobante del ultimo voucher
	 *
	 * @return {int} Retorna el último número de comprobante registrado para el punto de venta y tipo de comprobante
	 * enviado
	 **/
	async getLastVoucher(salesPoint, type) {
		const req = {
			'PtoVta' 	: salesPoint,
			'CbteTipo' 	: type
		};

		return (await this.executeRequest('FECompUltimoAutorizado', req)).CbteNro;
	}

	/**
	 * Autorización de comprobantes electrónicos por CAE
	 *
	 * Envía a los servidores de AFIP una solicitud para crear un comprobante
	 * y asignar un CAE  {@see https://www.afip.gob.ar/fe/ayuda/documentos/wsfev1-COMPG.pdf Specification item 2.1}
	 *
	 * @param {object} data datos del comprobante (Ver specification para los datos a enviar del comprobante) {@see  https://www.afip.gob.ar/fe/ayuda/documentos/wsfev1-COMPG.pdf Specification
	 * 	item 2.2.2}
	 * @param {bool}  returnResponse si es seteado a TRUE retorna la respuesta completa
	 * 	de AFIP
	 *
	 * @return {array} Retorna la información del comprobante de ingreso agregándole el CAE otorgado. Ante cualquier
     *	anomalía se retorna un código de error cancelando la ejecución del WS. 
	 *  Si returnResponse se establece en false devuelve: 
	 * 	[CAE : CAE assigned to voucher, CAEFchVto : Fecha de Expiracion
	 * 	para el CAE (yyyy-mm-dd)] si no retorna la informacion completa del comprobante en
	 * 	AFIP {@see https://www.afip.gob.ar/fe/ayuda/documentos/wsfev1-COMPG.pdf Specification item 2.2.3}
	 * 
	 * 
	 **/
	async createVoucher(data, returnResponse = false) {
		const req = {
			'FeCAEReq' : {
				'FeCabReq' : {
					'CantReg' 	: data['CbteHasta'] - data['CbteDesde'] + 1,
					'PtoVta' 	: data['PtoVta'],
					'CbteTipo' 	: data['CbteTipo']
				},
				'FeDetReq' : { 
					'FECAEDetRequest' : data
				}
			}
		};

		delete data['CantReg'];
		delete data['PtoVta'];
		delete data['CbteTipo'];

		if (data['Tributos']) 
			data['Tributos'] = { 'Tributo' : data['Tributos'] };

		if (data['Iva']) 
			data['Iva'] = { 'AlicIva' : data['Iva'] };
		
		if (data['CbtesAsoc']) 
			data['CbtesAsoc'] = { 'CbteAsoc' : data['CbtesAsoc'] };
		
		if (data['Compradores']) 
			data['Compradores'] = { 'Comprador' : data['Compradores'] };

		if (data['Opcionales']) 
			data['Opcionales'] = { 'Opcional' : data['Opcionales'] };

		const results = await this.executeRequest('FECAESolicitar', req);

		if (returnResponse === true) {
			return results;
		}
		else{
			if (Array.isArray(results.FeDetResp.FECAEDetResponse)) {
				results.FeDetResp.FECAEDetResponse = results.FeDetResp.FECAEDetResponse[0];
			}

			return {
				'CAE' 		: results.FeDetResp.FECAEDetResponse.CAE,
				'CAEFchVto' : this.formatDate(results.FeDetResp.FECAEDetResponse.CAEFchVto),
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
		const lastVoucher = await this.getLastVoucher(data['PtoVta'], data['CbteTipo']);
		
		const voucherNumber = lastVoucher + 1;

		data['CbteDesde'] = voucherNumber;
		data['CbteHasta'] = voucherNumber;

		let res 				= await this.createVoucher(data);
		res['voucherNumber'] 	= voucherNumber;

		return res;
	}


	/**
	 * Obtiene la informacion completa de un comprobante
	 *
	 * Retorna los detalles de un comprobante ya enviado y autorizado {@see https://www.afip.gob.ar/fe/ayuda/documentos/wsfev1-COMPG.pdf
	 * Specification item 2.2 }
	 *
	 * @param {int} number 		Numero de comprobante del cual se quiere información
	 * @param {int} salesPoint 	Punto de venta del comprobante del cual se quiere información
	 * @param {int} type 		Tipo de comprobante del cual se quiere información
	 *
	 * @return {Object|null} array con la informacion completa del comprobante
	 * 	{@see https://www.afip.gob.ar/fe/ayuda/documentos/wsfev1-COMPG.pdf Specification item 2.2.3 } or null si no existe
	 * 
	 **/ 
	async getVoucherInfo(number, salesPoint, type) {
		const req = {
			'FeCompConsReq' : {
				'CbteNro' 	: number,
				'PtoVta' 	: salesPoint,
				'CbteTipo' 	: type
			}
		};

		const result = await this.executeRequest('FECompConsultar', req)
		.catch(err => { if (err.code === 602) { return null } else { throw err }});

		return result.ResultGet;
	}

	/**
	 * Obtener listado de puntos de venta disponibles {@see WS 
	 * Specification item 2.12}
	 *
	 * @return {array} Listado de todos los puntos de venta
	 **/
	async getSalesPoints() {
		return (await this.executeRequest('FEParamGetPtosVenta')).ResultGet.PtoVenta;
	}

	/**
	 * Obtener tipos de comprobantes {@see WS 
	 * Specification item 2.5}
	 *
	 * @return {array} Listado de todos los tipos de comprobantes disponibles
	 **/
	async getVoucherTypes() {
		return (await this.executeRequest('FEParamGetTiposCbte')).ResultGet.CbteTipo;
	}

	/**
	 * Este método devuelve los tipos de conceptos posibles en este WS {@see WS 
	 * Specification item 2.6}
	 *
	 * @return {array} Listado de todos los tipos de concepto disponibles
	 **/
	async getConceptTypes() {
		return (await this.executeRequest('FEParamGetTiposConcepto')).ResultGet.ConceptoTipo;
	}

	/**
	 * Obtener todos los tipos de documento disponibles {@see WS 
	 * Specification item 2.7}
	 *
	 * @return {array} Listado de todos los tipos de documento disponibles
	 **/
	async getDocumentTypes() {
		return (await this.executeRequest('FEParamGetTiposDoc')).ResultGet.DocTipo;
	}

	/**
	 * Mediante este método se obtiene la totalidad de alícuotas de IVA posibles de uso en el presente
	 * WS, detallando código y descripción.
	 * {@see WS  Specification item 2.8}
	 *
	 * @return {array} Listado de todos las alícuotas de IVA posibles disponibles
	 **/
	async getAliquotTypes() {
		return (await this.executeRequest('FEParamGetTiposIva')).ResultGet.IvaTipo;
	}

	/**
	 * Obtener Monedas disponibles en el presente WS, indicando id y
	 * descripción de cada una {@see WS Specification item 2.9}
	 *
	 * @return {array} Listado de todos los tipos de monedas disponibles
	 **/
	async getCurrenciesTypes() {
		return (await this.executeRequest('FEParamGetTiposMonedas')).ResultGet.Moneda;
	}

	/**
	 * Este método permite consultar los códigos y descripciones de los tipos de datos Opcionales que se
	 * encuentran habilitados para ser usados en el WS. {@see WS Specification item 2.10}
	 *
	 * @return {array} Listado de todos los tipos de datos Opcionales disponibles
	 **/
	async getOptionsTypes() {
		return (await this.executeRequest('FEParamGetTiposOpcional')).ResultGet.OpcionalTipo;
	}

	/**
	 * Obtener los posibles códigos de tributos que puede contener un comprobante y su descripción {@see WS 
	 * Specification item 2.11}
	 *
	 * @return {array} Listado de todos los tipos de tributos disponibles
	 **/
	async getTaxTypes() {
		return (await this.executeRequest('FEParamGetTiposTributos')).ResultGet.TributoTipo;
	}

	/**
	 * @ignore
	 * Testeo de servicio {@see WS 
	 * Specification item 4.14}
	 *
	 * @return object { AppServer : Web Service status, 
	 * DbServer : Database status, AuthServer : Autentication 
	 * server status}
	 **/
	async getServerStatus() {
		return await this.executeRequest('FEDummy');
	}

	/**
	 * @ignore
	 * Change date from AFIP used format (yyyymmdd) to yyyy-mm-dd
	 *
	 * @param string|int date to format
	 *
	 * @return string date in format yyyy-mm-dd
	 **/
	formatDate(date) {
		return date.toString()
		.replace(/(\d{4})(\d{2})(\d{2})/, (string, year, month, day) => `${year}-${month}-${day}`);
	}

	/**
	 * @ignore
	 * Sends request to AFIP servers
	 * 
	 * @param string 	operation 	SOAP operation to do 
	 * @param array 	params 	Parameters to send
	 *
	 * @return mixed Operation results 
	 **/
	async executeRequest(operation, params = {})
	{
		Object.assign(params, await this.getWSInitialRequest(operation)); 

		const results = await super.executeRequest(operation, params);

		await this._checkErrors(operation, results);

		return results[operation+'Result'];
	}

	/**
	 * @ignore
	 * Make default request parameters for most of the operations
	 * 
	 * @param string operation SOAP Operation to do 
	 *
	 * @return array Request parameters  
	 **/
	async getWSInitialRequest(operation)
	{
		if (operation === 'FEDummy') {
			return {};
		}

		const { token, sign } = await this.afip.GetServiceTA('wsfe');

		return {
			'Auth' : { 
				'Token' : token,
				'Sign' 	: sign,
				'Cuit' 	: this.afip.CUIT
				}
		};
	}

	/**
	 * @ignore
	 * Check if occurs an error on Web Service request
	 * 
	 * @param string 	operation 	SOAP operation to check 
	 * @param mixed 	results 	AFIP response
	 *
	 * @throws Exception if exists an error in response 
	 * 
	 * @return void 
	 **/
	async _checkErrors(operation, results)
	{
		const res = results[operation+'Result'];

		if (operation === 'FECAESolicitar' && res.FeDetResp) {
			if (Array.isArray(res.FeDetResp.FECAEDetResponse)) {
				res.FeDetResp.FECAEDetResponse = res.FeDetResp.FECAEDetResponse[0];
			}
			
			if (res.FeDetResp.FECAEDetResponse.Observaciones && res.FeDetResp.FECAEDetResponse.Resultado !== 'A') {
				res.Errors = { Err : res.FeDetResp.FECAEDetResponse.Observaciones.Obs };
			}
		}

		if (res.Errors) {
			const err = Array.isArray(res.Errors.Err) ? res.Errors.Err[0] : res.Errors.Err;
			throw new Error(`(${err.Code}) ${err.Msg}`, err.Code);
		}
	}

}

