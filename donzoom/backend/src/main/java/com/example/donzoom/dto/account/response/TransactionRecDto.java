package com.example.donzoom.dto.account.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TransactionRecDto {

  private final String totalCount;
  private final List<TransactionDto> list;

}
