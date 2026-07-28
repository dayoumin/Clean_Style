// Generated from content/student-integrity/item-bank.json. Do not edit directly.
window.STUDENT_ITEM_BANK = [
  {
    "id": "SI-LEARNING-001",
    "revision": 2,
    "status": "draft",
    "domain": "수업·평가",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "standard",
    "construct": {
      "id": "academic-authorship",
      "label": "학업 저작 책임",
      "definition": "도구를 사용한 범위와 자신이 확인한 내용을 구분해 책임지는 판단"
    },
    "valueTension": [
      "마감 준수",
      "정확성·저작 책임"
    ],
    "choiceFrame": "first-information-check",
    "title": "과제와 생성형 AI",
    "scenario": "수행평가 제출까지 시간이 얼마 남지 않았습니다. 생성형 AI로 만든 초안에는 출처 표시가 있지만 정확한지 확인하지 못했고, 수업 안내에는 AI 사용 표시 방법이 자세히 적혀 있지 않습니다.",
    "decisionPrompt": "제출 방법을 정하기 전에 가장 먼저 무엇을 확인할까요?",
    "choices": [
      {
        "id": "check-guidance",
        "text": "과제 안내에서 AI 사용과 출처 표시 기준을 다시 확인한다"
      },
      {
        "id": "verify-sources",
        "text": "초안의 핵심 내용과 출처가 맞는지 먼저 확인한다"
      },
      {
        "id": "ask-standard",
        "text": "선생님에게 허용 범위와 표시 방법을 질문한다"
      },
      {
        "id": "check-class-materials",
        "text": "수업 자료와 내 메모에서 과제의 핵심 내용을 확인한다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "authorship",
        "text": "내가 작성하고 확인한 범위를 분명히 해야 해서"
      },
      {
        "id": "accuracy",
        "text": "틀린 정보와 확인되지 않은 출처가 들어갈 수 있어서"
      },
      {
        "id": "deadline",
        "text": "정해진 시간 안에 제출하는 것이 우선이라서"
      },
      {
        "id": "clear-rule",
        "text": "도구 사용 규칙을 정확히 아는 것이 중요해서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-02",
        "P-04"
      ],
      "method": [
        "M-01"
      ]
    },
    "riskNotes": [
      "학교별 AI 사용 기준 차이를 반영해야 함",
      "AI 사용 자체를 부정행위로 단정하지 않음"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "AI 사용을 선악으로 단정하지 않고 첫 확인 행동끼리 비교하도록 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-LEARNING-002",
    "revision": 2,
    "status": "draft",
    "domain": "수업·평가",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "standard",
    "construct": {
      "id": "bounded-peer-help",
      "label": "경계를 지키는 도움",
      "definition": "친구를 돕되 각자의 학습과 평가 책임을 침해하지 않는 방법을 찾는 판단"
    },
    "valueTension": [
      "친구 지원",
      "개별 학습·평가 책임"
    ],
    "choiceFrame": "first-support-path",
    "title": "친구의 과제 파일",
    "scenario": "친한 친구가 과제를 끝내지 못했다며 내가 작성한 파일을 보내 달라고 합니다. 참고만 하겠다고 하지만 제출 시간이 얼마 남지 않았습니다.",
    "decisionPrompt": "나라면 가장 먼저 무엇을 할까요?",
    "choices": [
      {
        "id": "ask-stuck-point",
        "text": "어느 부분에서 막혔는지 먼저 물어본다"
      },
      {
        "id": "share-method",
        "text": "내 파일 대신 풀이 과정이나 자료 찾는 방법을 설명한다"
      },
      {
        "id": "share-example",
        "text": "내 과제의 짧은 일부를 예시로 보여 주고 그대로 쓰지는 말라고 한다"
      },
      {
        "id": "ask-teacher",
        "text": "제출이 늦어질 수 있음을 선생님께 함께 알리자고 제안한다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "help-friend",
        "text": "어려운 친구를 돕는 것이 중요해서"
      },
      {
        "id": "own-work",
        "text": "각자 한 만큼 평가받아야 해서"
      },
      {
        "id": "learn-process",
        "text": "답보다 스스로 해보는 과정이 중요해서"
      },
      {
        "id": "honest-context",
        "text": "늦어진 사정을 솔직하게 설명하는 것이 나아서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-02",
        "P-04"
      ],
      "method": [
        "M-01"
      ]
    },
    "riskNotes": [
      "도움을 주는 행동과 답안 제공을 구분해야 함",
      "친구 관계를 나쁜 동기로 해석하지 않음"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "파일 제공 여부의 노골적 정답 대신 도움의 경계를 정하는 첫 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-PEER-001",
    "revision": 2,
    "status": "draft",
    "domain": "친구 관계",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "help-seeking",
    "construct": {
      "id": "digital-consent",
      "label": "디지털 동의와 피해 예방",
      "definition": "사진 당사자의 의사와 공개 범위를 고려하면서 안전하게 공유 여부를 판단하는 과정"
    },
    "valueTension": [
      "또래의 즐거움·편의",
      "당사자 동의·피해 예방"
    ],
    "choiceFrame": "first-protective-response",
    "title": "단체 대화방의 사진",
    "scenario": "친구가 재미있는 사진이라며 다른 학생의 얼굴이 나온 사진을 단체 대화방에 올리려고 합니다. 사진 속 학생은 아직 모릅니다.",
    "decisionPrompt": "나라면 가장 먼저 무엇을 할까요?",
    "choices": [
      {
        "id": "pause-sharing",
        "text": "올리기 전에 잠시 멈추고 당사자의 의사를 확인하자고 한다"
      },
      {
        "id": "ask-permission",
        "text": "사진 속 학생에게 원하는 공개 범위를 따로 물어본다"
      },
      {
        "id": "limited-share",
        "text": "반 대화방 안에서만 공유하는 방법을 먼저 제안한다"
      },
      {
        "id": "seek-help",
        "text": "직접 말하기 어렵다면 믿을 수 있는 어른에게 어떻게 대응할지 도움을 구한다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "consent",
        "text": "사진에 나온 사람이 공개 범위를 정할 수 있어야 해서"
      },
      {
        "id": "group-fun",
        "text": "친구들과 즐거움을 나누는 것도 중요해서"
      },
      {
        "id": "reduce-harm",
        "text": "당사자가 불편하거나 피해를 볼 가능성을 줄여야 해서"
      },
      {
        "id": "safe-support",
        "text": "혼자 나서기 어렵거나 위험할 때 안전하게 도움받는 것이 나아서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-03",
        "P-04",
        "E-03"
      ],
      "method": [
        "M-02"
      ]
    },
    "riskNotes": [
      "피해 경험을 묻는 문항으로 바뀌지 않게 함",
      "직접 대항보다 도움 요청 선택을 포함함"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "공개 대면을 요구하지 않고 동의 확인과 도움 요청의 첫 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-PEER-002",
    "revision": 2,
    "status": "draft",
    "domain": "친구 관계",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "help-seeking",
    "construct": {
      "id": "safe-bystander-response",
      "label": "안전한 주변인 대응",
      "definition": "확인되지 않은 정보의 확산을 줄이면서 자신과 당사자의 안전을 고려해 대응하는 판단"
    },
    "valueTension": [
      "관계·자기보호",
      "사실 확인·피해 예방"
    ],
    "choiceFrame": "first-protective-response",
    "title": "확인되지 않은 소문",
    "scenario": "단체 대화방에서 한 학생에 대한 좋지 않은 이야기가 빠르게 퍼지고 있습니다. 사실인지 확인한 사람은 없지만 친구들은 모두 알고 있다고 말합니다.",
    "decisionPrompt": "나라면 가장 먼저 무엇을 할까요?",
    "choices": [
      {
        "id": "stop-forwarding",
        "text": "내용을 다른 사람에게 더 보내지 않는다"
      },
      {
        "id": "check-source",
        "text": "공개적으로 따지지 않고 정보의 출처가 있는지 확인한다"
      },
      {
        "id": "tell-adult",
        "text": "믿을 수 있는 어른에게 상황을 알리고 대응 방법을 묻는다"
      },
      {
        "id": "ask-support",
        "text": "누구에게 알리는 것이 안전한지 믿을 수 있는 사람에게 먼저 묻는다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "fact-check",
        "text": "사실이 아닌 정보가 사람에게 피해를 줄 수 있어서"
      },
      {
        "id": "group-pressure",
        "text": "공개적으로 말하면 나도 표적이 되거나 관계가 어려워질까 걱정돼서"
      },
      {
        "id": "safe-help",
        "text": "혼자 해결하기보다 안전하게 도움을 받는 것이 나아서"
      },
      {
        "id": "know-context",
        "text": "판단 전에 전체 상황을 더 알아야 해서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-03",
        "E-03",
        "E-04"
      ],
      "method": [
        "M-02"
      ]
    },
    "riskNotes": [
      "실제 괴롭힘 경험을 떠올리게 할 수 있어 중단 안내 필요",
      "학생에게 단독 해결 책임을 부과하지 않음"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "방관을 비난하지 않고 비확산·확인·도움 요청의 안전한 첫 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-GROUP-001",
    "revision": 2,
    "status": "draft",
    "domain": "모둠·학생자치",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "standard",
    "construct": {
      "id": "contribution-fairness",
      "label": "기여와 사정을 함께 보는 공정성",
      "definition": "공동과제의 실제 기여와 참여하지 못한 사정을 확인한 뒤 공정한 절차를 찾는 판단"
    },
    "valueTension": [
      "개인 사정·관계 보호",
      "기여의 공정한 반영"
    ],
    "choiceFrame": "first-information-check",
    "title": "모둠 과제의 이름",
    "scenario": "모둠 과제 마감 직전입니다. 한 친구가 개인 사정으로 거의 참여하지 못했고, 모둠에서는 그 친구의 이름을 빼자는 의견이 나왔습니다.",
    "decisionPrompt": "이름을 어떻게 적을지 판단하기 전에 가장 먼저 무엇을 확인할까요?",
    "choices": [
      {
        "id": "contact-first",
        "text": "사적인 이유를 묻지 않고 그 친구가 맡기로 한 역할의 현재 상태를 확인한다"
      },
      {
        "id": "list-contributions",
        "text": "모둠원별로 지금까지 맡은 일과 남은 일을 정리한다"
      },
      {
        "id": "teacher-check",
        "text": "선생님에게 이런 경우의 평가 기준을 먼저 확인한다"
      },
      {
        "id": "check-role-plan",
        "text": "처음 작성한 역할 분담표와 변경된 약속을 확인한다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "fair-contribution",
        "text": "실제로 기여한 정도가 공정하게 반영되어야 해서"
      },
      {
        "id": "check-context",
        "text": "판단 전에 친구의 사정과 가능한 역할을 알아야 해서"
      },
      {
        "id": "shared-standard",
        "text": "모두가 동의할 수 있는 기준을 확인해야 해서"
      },
      {
        "id": "protect-relationship",
        "text": "친구 관계와 모둠 분위기도 중요해서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-02",
        "P-04"
      ],
      "method": [
        "M-01"
      ]
    },
    "riskNotes": [
      "개인 사정을 무임승차와 동일시하지 않음",
      "기여도와 배려를 단일 정답으로 배열하지 않음"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "이름 제외의 즉시 결론 대신 사정·기여·기준을 확인하는 첫 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-GROUP-002",
    "revision": 2,
    "status": "draft",
    "domain": "모둠·학생자치",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "standard",
    "construct": {
      "id": "conflict-transparency",
      "label": "관계 공개와 투명한 비교",
      "definition": "개인적 관계가 있는 선택지에서도 관계를 숨기지 않고 공통 기준으로 비교하는 판단"
    },
    "valueTension": [
      "준비 편의·관계",
      "투명성·동일 기준"
    ],
    "choiceFrame": "first-information-check",
    "title": "학생회 행사의 물품 선택",
    "scenario": "학생회 행사 물품 후보를 살펴보던 중 한 임원의 가족이 운영하는 가게가 추천되었습니다. 다른 후보와 가격은 비슷하고, 행사 준비를 도와줄 수 있다고 합니다.",
    "decisionPrompt": "후보를 비교하기 전에 가장 먼저 무엇을 확인할까요?",
    "choices": [
      {
        "id": "check-relationship",
        "text": "추천한 사람과 가게의 관계가 참여자들에게 알려져 있는지 확인한다"
      },
      {
        "id": "set-criteria",
        "text": "가격·품질·지원 조건을 비교할 공통 기준부터 정한다"
      },
      {
        "id": "check-process",
        "text": "담당교사에게 학생회 물품 선택 절차를 확인한다"
      },
      {
        "id": "collect-options",
        "text": "비교할 수 있도록 다른 가게의 조건도 함께 알아본다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "same-standard",
        "text": "누구에게나 같은 기준을 적용해야 해서"
      },
      {
        "id": "practical-help",
        "text": "행사를 원활하게 준비하는 것이 중요해서"
      },
      {
        "id": "transparency",
        "text": "관계를 공개하면 함께 판단할 수 있어서"
      },
      {
        "id": "avoid-suspicion",
        "text": "특혜라는 오해가 생기지 않는 것이 중요해서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-02",
        "P-04"
      ],
      "method": [
        "M-01"
      ]
    },
    "riskNotes": [
      "공공계약의 성인 법률 문항처럼 만들지 않음",
      "관계가 있다는 이유만으로 부정하다고 단정하지 않음"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "구매 결론 대신 관계 공개·기준·절차·대안 확인의 첫 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-DIGITAL-001",
    "revision": 2,
    "status": "draft",
    "domain": "디지털 생활",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "standard",
    "construct": {
      "id": "collaborative-change-transparency",
      "label": "공동작업 변경의 투명성",
      "definition": "공동문서의 품질과 원래 작성자의 참여를 함께 고려해 변경을 알리고 조율하는 판단"
    },
    "valueTension": [
      "마감·완성도",
      "공동 소유·설명 책임"
    ],
    "choiceFrame": "first-collaboration-step",
    "title": "공유 문서의 기록",
    "scenario": "모둠 공유 문서에서 다른 친구가 쓴 부분을 크게 고쳤습니다. 제출 시간이 가까워 친구에게 설명할 시간은 많지 않습니다.",
    "decisionPrompt": "나라면 가장 먼저 무엇을 할까요?",
    "choices": [
      {
        "id": "mark-change",
        "text": "바뀐 핵심 부분과 이유를 문서 댓글에 표시한다"
      },
      {
        "id": "message-author",
        "text": "원래 작성한 친구에게 변경 내용을 먼저 알린다"
      },
      {
        "id": "compare-version",
        "text": "모둠원들이 볼 수 있도록 변경 전후 버전을 정리한다"
      },
      {
        "id": "ask-group",
        "text": "제출 전에 확인할 핵심 변경을 모둠 대화방에 올린다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "shared-ownership",
        "text": "공동 작업의 변경은 함께 알아야 해서"
      },
      {
        "id": "quality",
        "text": "과제의 완성도를 높이는 것이 가장 중요해서"
      },
      {
        "id": "respect-work",
        "text": "친구가 한 일을 함부로 바꾸면 안 된다고 생각해서"
      },
      {
        "id": "deadline",
        "text": "시간 안에 현실적인 결정을 해야 해서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-04"
      ],
      "method": [
        "M-01"
      ]
    },
    "riskNotes": [
      "협업 도구 사용 경험 차이를 확인해야 함",
      "수정 자체를 옳고 그름으로 단정하지 않음"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "수정 여부의 선악 판단 대신 변경을 투명하게 알리는 첫 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-DIGITAL-002",
    "revision": 2,
    "status": "draft",
    "domain": "디지털 생활",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "help-seeking",
    "construct": {
      "id": "account-boundary",
      "label": "계정 경계와 공식 도움",
      "definition": "급한 과제 상황에서도 계정 책임을 섞지 않고 이용 가능한 도움 경로를 찾는 판단"
    },
    "valueTension": [
      "과제의 긴급성",
      "계정 보안·책임 구분"
    ],
    "choiceFrame": "first-support-path",
    "title": "친구 계정으로 로그인",
    "scenario": "학교 온라인 자료를 급히 확인해야 하는데 내 계정에 접속되지 않습니다. 친구가 잠깐 자기 계정을 사용해도 된다고 알려줍니다.",
    "decisionPrompt": "나라면 가장 먼저 무엇을 할까요?",
    "choices": [
      {
        "id": "recovery-guide",
        "text": "내 계정의 비밀번호 재설정이나 접속 안내를 먼저 확인한다"
      },
      {
        "id": "request-help",
        "text": "담당 선생님이나 학교 온라인 학습 지원 창구에 도움을 요청한다"
      },
      {
        "id": "use-together",
        "text": "친구가 직접 로그인한 화면에서 필요한 자료의 위치만 함께 확인해 달라고 한다"
      },
      {
        "id": "notify-delay",
        "text": "접속 문제 때문에 늦어질 수 있음을 과제 담당 선생님께 알린다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "self-recovery",
        "text": "내 계정 문제는 먼저 내가 사용할 수 있는 복구 절차를 확인하는 것이 나아서"
      },
      {
        "id": "account-responsibility",
        "text": "계정 기록과 책임이 섞이면 안 돼서"
      },
      {
        "id": "urgent-task",
        "text": "필요한 일을 제때 마치는 것이 중요해서"
      },
      {
        "id": "safe-support",
        "text": "문제가 생기면 공식 도움을 받는 것이 안전해서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-03",
        "P-04"
      ],
      "method": [
        "M-02"
      ]
    },
    "riskNotes": [
      "실제 비밀번호 입력을 요구하지 않음",
      "계정 공유 피해 경험을 수집하지 않음"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "계정 공유를 선택지에서 제거하고 복구·공식 도움·대체 자료의 첫 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-RULE-001",
    "revision": 2,
    "status": "draft",
    "domain": "학교 규칙",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "help-seeking",
    "construct": {
      "id": "fair-rule-voice",
      "label": "공정한 규칙에 대한 안전한 의견 제시",
      "definition": "규칙의 목적과 적용 기준을 확인하고 자신에게 안전한 방식으로 의견을 전달하는 판단"
    },
    "valueTension": [
      "공동질서·즉시 준수",
      "설명 요구·공정한 적용"
    ],
    "choiceFrame": "first-information-check",
    "title": "이유를 알기 어려운 규칙",
    "scenario": "학급에서 새 규칙이 정해졌지만 왜 필요한지 설명을 듣지 못했습니다. 상황에 따라 예외가 적용된다는 말도 있지만 구체적인 기준은 안내되지 않았습니다.",
    "decisionPrompt": "의견을 정하기 전에 가장 먼저 무엇을 확인할까요?",
    "choices": [
      {
        "id": "ask-reason",
        "text": "규칙의 목적과 예외 기준이 안내되어 있는지 먼저 확인한다"
      },
      {
        "id": "check-examples",
        "text": "예외가 적용된 상황이 실제로 같은 조건인지 살펴본다"
      },
      {
        "id": "seek-support",
        "text": "혼자 말하기 어렵다면 믿을 수 있는 어른이나 학생 대표에게 상의한다"
      },
      {
        "id": "request-channel",
        "text": "학생 의견을 전달할 수 있는 공식 방법이 있는지 알아본다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "understand-purpose",
        "text": "목적을 알아야 규칙을 납득할 수 있어서"
      },
      {
        "id": "order",
        "text": "공동생활에서는 정해진 기준을 따르는 것이 중요해서"
      },
      {
        "id": "fair-application",
        "text": "같은 상황에는 같은 기준이 적용돼야 해서"
      },
      {
        "id": "safe-voice",
        "text": "문제를 안전하고 정해진 방식으로 말하는 것이 나아서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-01",
        "P-04"
      ],
      "method": [
        "M-02"
      ]
    },
    "riskNotes": [
      "규칙 비판을 불순응으로 해석하지 않음",
      "교사에게 직접 맞서는 선택만 요구하지 않음"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "준수와 불순응의 양자택일을 없애고 기준 확인과 안전한 의견 경로로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-RULE-002",
    "revision": 2,
    "status": "draft",
    "domain": "학교 규칙",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "standard",
    "construct": {
      "id": "shared-resource-consent",
      "label": "공동자원 사용의 동의",
      "definition": "공동 물품의 개인 사용 여부를 기존 약속과 구성원의 동의를 통해 판단하는 과정"
    },
    "valueTension": [
      "개인 활용·편의",
      "공동 동의·사용 경계"
    ],
    "choiceFrame": "first-information-check",
    "title": "공동 물품의 개인 사용",
    "scenario": "동아리에서 함께 구입한 물품이 다음 일정 전까지 비어 있습니다. 개인 활동에도 쓸 수 있을 것 같지만 개인 사용에 관한 기준이 정해져 있는지는 모릅니다.",
    "decisionPrompt": "개인 사용 여부를 정하기 전에 가장 먼저 무엇을 확인할까요?",
    "choices": [
      {
        "id": "check-rule",
        "text": "동아리에 개인 사용에 관한 기존 약속이 있는지 확인한다"
      },
      {
        "id": "check-members",
        "text": "구성원들이 개인 사용을 어떻게 생각하는지 확인한다"
      },
      {
        "id": "check-condition",
        "text": "물품의 상태와 다음 사용 일정을 먼저 확인한다"
      },
      {
        "id": "check-manager",
        "text": "담당교사에게 동아리 물품의 사용 범위를 확인한다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "shared-consent",
        "text": "공동 물품은 함께 정한 범위에서 써야 해서"
      },
      {
        "id": "no-harm",
        "text": "피해가 없고 제때 돌려놓으면 괜찮다고 생각해서"
      },
      {
        "id": "clear-boundary",
        "text": "공동 사용과 개인 사용의 경계를 지켜야 해서"
      },
      {
        "id": "future-standard",
        "text": "다음에도 적용할 수 있는 기준이 필요해서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-02",
        "P-04"
      ],
      "method": [
        "M-01"
      ]
    },
    "riskNotes": [
      "절제를 소유물 사용 금지로 단순화하지 않음",
      "물품 가치에 따라 판단이 달라지는지 확인 필요"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "사용과 금지의 노골적 대비 대신 약속·동의·상태를 확인하는 첫 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-COMMUNITY-001",
    "revision": 2,
    "status": "draft",
    "domain": "학교·지역 활동",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "standard",
    "construct": {
      "id": "accurate-records",
      "label": "기록의 정확성과 절차 확인",
      "definition": "활동 시간의 인정 기준이 불분명할 때 사실과 공식 기준을 확인해 기록하는 판단"
    },
    "valueTension": [
      "담당자 판단·처리 편의",
      "기록 정확성·공식 기준"
    ],
    "choiceFrame": "first-information-check",
    "title": "봉사활동 시간 기록",
    "scenario": "봉사활동 현장 활동은 예상보다 일찍 끝났고, 정리와 대기 시간이 활동 시간에 포함되는지는 분명하지 않습니다. 확인서에는 예정된 전체 시간이 적혀 있습니다.",
    "decisionPrompt": "확인서를 제출하기 전에 가장 먼저 무엇을 확인할까요?",
    "choices": [
      {
        "id": "ask-inclusion",
        "text": "현장 담당자에게 정리와 대기 시간의 인정 기준을 묻는다"
      },
      {
        "id": "note-times",
        "text": "도착·활동·정리 시간을 기억나는 범위에서 먼저 기록한다"
      },
      {
        "id": "explain-school",
        "text": "학교 담당자에게 상황을 설명하고 처리 기준을 확인한다"
      },
      {
        "id": "check-notice",
        "text": "봉사활동 안내문에 시간 인정 범위가 적혀 있는지 확인한다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "accurate-record",
        "text": "기록은 실제 활동과 맞아야 해서"
      },
      {
        "id": "field-guidance",
        "text": "현장 운영을 맡은 담당자가 활동 범위를 가장 잘 알 것 같아서"
      },
      {
        "id": "official-standard",
        "text": "내가 정하기보다 공식 기준을 확인하는 것이 나아서"
      },
      {
        "id": "avoid-risk",
        "text": "불확실한 기록으로 문제가 생기는 것을 피하고 싶어서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-02",
        "P-04"
      ],
      "method": [
        "M-01"
      ]
    },
    "riskNotes": [
      "봉사활동 제도 변경 가능성을 확인해야 함",
      "성인 담당자의 지시와 학생 책임을 균형 있게 다룸"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "허위 기록의 명백한 상황 대신 인정 범위가 불분명한 상황과 확인 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  },
  {
    "id": "SI-COMMUNITY-002",
    "revision": 2,
    "status": "draft",
    "domain": "학교·지역 활동",
    "gradeBands": [
      "middle",
      "high"
    ],
    "safetyMode": "standard",
    "construct": {
      "id": "collective-fund-purpose",
      "label": "공동기금의 목적과 참여 절차",
      "definition": "공동활동에서 생긴 돈의 원래 목적과 참여자의 의견을 확인해 사용 절차를 정하는 판단"
    },
    "valueTension": [
      "기여 보상",
      "공동 이익·사전 약속"
    ],
    "choiceFrame": "first-information-check",
    "title": "축제 수익금 사용",
    "scenario": "담당교사와 함께 운영한 학급 축제 부스에서 수익금이 예상보다 많이 남았습니다. 사전에 정한 사용 기준이 분명하지 않아 간식을 사자는 의견과 학급 전체를 위해 쓰자는 의견이 나왔습니다.",
    "decisionPrompt": "사용 방법을 정하기 전에 가장 먼저 무엇을 확인할까요?",
    "choices": [
      {
        "id": "check-agreement",
        "text": "부스 준비 때 정한 수익금 사용 약속이 있는지 확인한다"
      },
      {
        "id": "check-rule",
        "text": "담당교사에게 학교 회계상 가능한 사용 범위를 묻는다"
      },
      {
        "id": "collect-views",
        "text": "준비 학생과 학급 구성원의 의견을 각각 들어본다"
      },
      {
        "id": "check-purpose",
        "text": "부스 운영의 원래 목적과 학급 행사 계획을 다시 확인한다"
      }
    ],
    "reasonPrompt": "그 행동을 고른 이유와 가장 가까운 것은 무엇인가요?",
    "reasons": [
      {
        "id": "reward-effort",
        "text": "실제로 수고한 사람의 기여를 인정해야 해서"
      },
      {
        "id": "common-benefit",
        "text": "학급 활동에서 생긴 돈은 모두에게 도움이 돼야 해서"
      },
      {
        "id": "original-purpose",
        "text": "돈을 모을 때 약속한 목적을 지켜야 해서"
      },
      {
        "id": "balanced-benefit",
        "text": "기여와 공동 이익을 함께 고려해야 해서"
      }
    ],
    "sourceBasis": {
      "content": [
        "P-02",
        "P-04"
      ],
      "method": [
        "M-01"
      ]
    },
    "riskNotes": [
      "특정 선택을 횡령처럼 표현하지 않음",
      "학급별 실제 회계 규칙 차이를 확인해야 함"
    ],
    "revisionHistory": [
      {
        "revision": 1,
        "date": "2026-07-28",
        "summary": "초기 후보 작성"
      },
      {
        "revision": 2,
        "date": "2026-07-28",
        "summary": "사용 결론끼리 경쟁시키지 않고 약속·규칙·의견·기준 확인의 첫 행동으로 수정"
      }
    ],
    "reviews": {
      "content": {
        "status": "pending",
        "evidenceRefs": []
      },
      "studentLanguage": {
        "status": "pending",
        "evidenceRefs": []
      },
      "safeguarding": {
        "status": "pending",
        "evidenceRefs": []
      }
    }
  }
];
