import vk from 'config/vk'
import { vkPerson } from "app/models"
import { cond, pipe, anyPass, equals, prop, propEq, find } from 'ramda'
import { delay } from "app/services/utils"
import logger from "app/services/logger"

export const addFriend = async (person) => {
  // NOTE
  // 1 — заявка на добавление данного пользователя в друзья отправлена;
  // 2 — заявка на добавление в друзья от данного пользователя одобрена;
  // 4 — повторная отправка заявки.
  const res = await vk.api.friends.add({ user_id: Number.parseInt(person.uid) })

  if (anyPass([equals(1), equals(2), equals(4)])(res)) {
    await person.set({ isFriend: true })
    await person.save()
  }

  return true
}

export const andPersonInFriend = async () => {
  try {
    const person = await vkPerson.findOne({ where: { isFriend: false } })

    if (!person) {
      logger.info("users not found")
    }

    await addFriend(person)

    logger.info(person.uid, "add in friend")
  } catch (err) {
    logger.error(err)
  }
}

export const checkFriend = async (userId) => {
  const response = await vk.api.friends.areFriends({
    user_ids: [userId],
  })

  const checkHaveFriendStatusUserId = pipe(
    find(propEq('user_id', Number.parseInt(userId))),
    prop("friend_status"),
    anyPass([equals(1), equals(2), equals(3)])
  )

  return checkHaveFriendStatusUserId(response)
}

export const checkAndSetFriend = async (person) => {
  const isFriend = await checkFriend(person.uid)

  await person.set({ isFriend })
  await person.save()

  logger.info("checkAndSetFriend", person.uid, person.isFriend)
  await delay(2000)
}