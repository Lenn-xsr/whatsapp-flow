import Message from '../../domain/message';

export default interface MessageBrokerPort {
  /** Announces an inbound message to the services that react to it. */
  publishMessage(message: Message): Promise<void>;
}
