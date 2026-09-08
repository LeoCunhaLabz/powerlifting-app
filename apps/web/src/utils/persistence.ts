/**
 * Helpers de persistência em localStorage (issue #266).
 *
 * O bug: ao finalizar um treino, o estado (com a sessão nova no history) e o
 * `activeWorkout=null` são atualizados no mesmo commit do React. Dois effects
 * rodam: um grava o estado, outro remove a chave de backup do treino ativo. Se a
 * gravação do estado falha (cota cheia), o history novo NÃO é persistido mas a
 * chave de backup era removida assim mesmo — o treino recém-finalizado sumia de
 * vez após um reload (nem no history salvo, nem no backup ativo).
 */

type SettableStorage = Pick<Storage, 'setItem'>

/** Grava no storage; retorna `true` no sucesso, `false` em qualquer erro (cota, modo privado). */
export function trySetItem(storage: SettableStorage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/**
 * A chave de backup do treino ativo só pode ser removida quando NÃO há treino
 * ativo **e** a última gravação do estado principal teve sucesso. Se o estado
 * falhou ao salvar, o backup é a única cópia do treino recém-finalizado —
 * mantê-lo é o que evita a perda total.
 */
export function shouldClearActiveBackup(hasActiveWorkout: boolean, lastStateSaveOk: boolean): boolean {
  return !hasActiveWorkout && lastStateSaveOk
}
