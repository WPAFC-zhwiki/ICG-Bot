import { ExtendsMap, handlers } from '../../init';
import { Context, extra, optin } from '../../lib/handlers/Context';
import { MessageHandler } from '../../lib/handlers/MessageHandler';

let clientFullNames = {};

type BridgeMsgOptin = optin & {
	noPrefix?: boolean;
	isNotice?: boolean;
	from_uid?: string;
	to_uid?: string;
	rawFrom?: string;
	rawTo?: string;
}

export class BridgeMsg extends Context {
	private _isNotice: boolean;
	get isNotice(): boolean {
		return this._isNotice;
	}

	private _noPrefix = false;
	get noPrefix(): boolean {
		return this._noPrefix;
	}
	set noPrefix( f: boolean ) {
		this._noPrefix = !!f;
	}

	readonly rawFrom: string;
	readonly rawTo: string;

	private __from: string = null;
	get from(): string {
		return this.__from;
	}
	set from( f: string ) {
		this.__from = String( f );
		this._from_uid = `${ ( this._from_client || '' ).toLowerCase() }/${ f }`;
	}

	private __to: string = null;
	get to(): string {
		return this.__to;
	}
	set to( f: string ) {
		this.__to = String( f );
		this._to_uid = `${ ( this._to_client || '' ).toLowerCase() }/${ f }`;
	}

	private _from_client: string;
	private _to_client: string;

	private _from_uid: string;
	get from_uid(): string {
		return this._from_uid;
	}
	set from_uid( u: string ) {
		const { client, id, uid } = BridgeMsg.parseUID( u );
		this.__from = id;
		this._from_uid = uid;
		this._from_client = client;
	}

	private _to_uid: string;
	get to_uid(): string {
		return this._to_uid;
	}
	set to_uid( u: string ) {
		const { client, id, uid } = BridgeMsg.parseUID( u );
		this.__to = id;
		this._to_uid = uid;
		this._to_client = client;
	}

	extra: extra & {
		noPrefix?: boolean;
		isNotice?: boolean;
	};

	constructor( context: BridgeMsg | Context | BridgeMsgOptin, overrides: BridgeMsgOptin = {} ) {
		super( context, overrides );

		const that = Object.assign( {}, context, overrides );

		this._isNotice = false;

		this._from_client = this._to_client = this.handler.type;

		this.__from = String( context.from || this._from || super._from );
		this.__to = String( context.to || this._from || super._to );

		this.rawFrom = overrides.rawFrom || `${ this._from_client }/${ this.__from }`;
		this.rawTo = overrides.rawTo || `${ this._to_client }/${ this.__to }`;

		this.from_uid = Context.getArgument( overrides.from_uid, this.rawFrom );
		this.to_uid = Context.getArgument( overrides.to_uid, this.rawTo );

		this._noPrefix = !!that.noPrefix;
		this._isNotice = !!that.isNotice;

		Object.assign( this.extra, {
			noPrefix: !!that.noPrefix,
			isNotice: !!that.isNotice
		} );
	}

	// eslint-disable-next-line no-shadow
	static setHandlers( handlers: ExtendsMap<string, MessageHandler, handlers> ): void {
		// 取得用戶端簡稱所對應的全稱
		clientFullNames = {};
		for ( const [ type, handler ] of handlers ) {
			clientFullNames[ handler.id.toLowerCase() ] = type;
			clientFullNames[ type.toLowerCase() ] = type;
		}
	}

	static parseUID( u: string ): {
		client: string,
		id: string,
		uid: string
	} {
		let client: string = null, id: string = null, uid: string = null;
		if ( u ) {
			const s = u.toString();
			const i = s.indexOf( '/' );

			if ( i !== -1 ) {
				client = s.substr( 0, i ).toLowerCase();
				if ( clientFullNames[ client ] ) {
					client = clientFullNames[ client ];
				}

				id = s.substr( i + 1 );
				uid = `${ client.toLowerCase() }/${ id }`;
			}
		}
		return { client, id, uid };
	}

	static getUIDFromContext( context: Context | BridgeMsg, id: string | number ): string | null {
		if ( !context.handler ) {
			return null;
		}

		return `${ context.handler.type.toLowerCase() }/${ id }`;
	}

	static getSimpleContext( context: Context | BridgeMsg ): {
		from: string;
		to: string;
		isPrivate: boolean;
		handler: MessageHandler;
	} {
		return {
			from: context.from,
			to: context.to,
			isPrivate: context.isPrivate,
			handler: context.handler
		};
	}
}
