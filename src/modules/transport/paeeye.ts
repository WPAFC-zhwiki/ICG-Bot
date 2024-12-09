import winston = require( 'winston' );

import { ConfigTS } from '@app/config';
import { Manager } from '@app/init';

import * as bridge from '@app/modules/transport/bridge';
import { BridgeMessage } from '@app/modules/transport/BridgeMessage';

Manager.global.ifEnable( 'transport', function () {
	bridge.addHook( 'bridge.send', function ( message: BridgeMessage ) {
		return new Promise<void>( function ( resolve, reject ) {
			const paeeye: ConfigTS[ 'transport' ][ 'options' ][ 'paeeye' ] = Manager.config.transport.options.paeeye;

			if (
				(
					paeeye.prepend && message.text.startsWith( paeeye.prepend ) ||
					paeeye.inline && message.text.includes( paeeye.inline ) ||
					paeeye.regexp && paeeye.regexp.test( message.text )
				)
			) {
				winston.debug( `[transport/paeeye] #${ message.msgId }: Ignored.` );
				reject( false );
				return;
			} else if (
				message.extra.reply &&
				(
					paeeye.prepend && message.extra.reply.message.startsWith( paeeye.prepend ) ||
					paeeye.inline && message.extra.reply.message.includes( paeeye.inline ) ||
					paeeye.regexp && paeeye.regexp.test( message.extra.reply.message )
				)
			) {
				winston.debug( `[transport/paeeye] #${ message.msgId }: Ignored.` );
				reject( false );
				return;
			}

			resolve();
		} );
	} );
} );
